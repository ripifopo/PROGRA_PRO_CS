from pathlib import Path
import json, httpx, re, time
from datetime import datetime
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = Path(__file__).resolve().parent.parent.parent
INPUT_FILE = BASE_DIR / "url_extractor/extracted_urls/cruzverde_urls.json"
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = BASE_DIR / f"product_updates/cruzverde/{timestamp}"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

API_URL = "https://api.cruzverde.cl/product-service/products/detail/{}?inventoryId=zonaS2Soriente"

def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/ibuprofeno-600-mg-20-comprimidos/273362.html", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

def extract_id_from_url(url):
    match = re.search(r"/(\d+)\.html", url)
    return match.group(1) if match else None

def process_category(categoria, urls, headers):
    result = []
    for url in urls:
        product_id = extract_id_from_url(url)
        if not product_id:
            print(f"❌ No se pudo extraer ID de: {url}")
            continue

        for attempt in range(2):
            try:
                api_url = API_URL.format(product_id)
                r = httpx.get(api_url, headers=headers, timeout=20)
                if "INVALID_SESSION" in r.text or r.status_code == 401:
                    if attempt == 0:
                        print("🔁 Cookie expirada. Renovando y reintentando...")
                        cookie = get_cruzverde_cookie()
                        headers["Cookie"] = cookie
                        continue
                    else:
                        raise Exception("Sesión inválida persistente.")

                r.raise_for_status()
                data = r.json().get("productData", {})
                prices = data.get("prices", {})
                price_offer = prices.get("price-sale-cl") or prices.get("price-list-cl")
                price_normal = prices.get("price-list-cl") if prices.get("price-sale-cl") else None
                discount = round((1 - price_offer / price_normal) * 100) if price_normal and price_normal > price_offer else 0

                result.append({
                    "id": int(product_id),
                    "pharmacy": "Farmacia Cruz Verde",
                    "url": f"https://www.cruzverde.cl/{data.get('name')}/{product_id}.html",
                    "api_url": api_url,
                    "name": data.get("name"),
                    "image": data.get("metaTags", {}).get("ogImage"),
                    "bioequivalent": data.get("isBioequivalent") is True,
                    "category": categoria.split("/")[0],
                    "subcategory": categoria.split("/")[1] if "/" in categoria else None,
                    "price_offer": price_offer,
                    "price_normal": price_normal,
                    "discount": discount
                })
                break

            except Exception as e:
                print(f"⚠️ Error en producto {product_id}: {e}")
                break

        time.sleep(0.2)

    if result:
        output_path = OUTPUT_DIR / f"{categoria.split('/')[0]}.json"
        existing = []
        if output_path.exists():
            with open(output_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(existing + result, f, indent=2, ensure_ascii=False)
        print(f"✅ Guardado: {output_path} ({len(result)} productos)")

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        category_urls = json.load(f)

    cookie = get_cruzverde_cookie()
    headers = {
        "Accept": "application/json",
        "Origin": "https://www.cruzverde.cl",
        "Referer": "https://www.cruzverde.cl/",
        "Cookie": cookie
    }

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(process_category, categoria, urls, headers.copy()): categoria
            for categoria, urls in category_urls.items()
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {name}: {e}")

if __name__ == "__main__":
    main()
