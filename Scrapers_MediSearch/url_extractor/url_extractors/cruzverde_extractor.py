import json
import httpx
from playwright.sync_api import sync_playwright

BASE_API = "https://api.cruzverde.cl/product-service/products/search"
BASE_URL = "https://www.cruzverde.cl/medicamentos"
CATEGORIES_FILE = "../structured_categories/cruzverde_categories.json"
OUTPUT_FILE = "../extracted_urls/cruzverde_urls.json"

# Obtener cookie de sesión con Playwright
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/medicamentos/", wait_until="networkidle")
        cookies = context.cookies()
        cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
        browser.close()
        return cookie_str


# Obtener URLs de los productos de una subcategoría
def get_all_product_urls(cgid, cookie):
    headers = {
        "Accept": "application/json",
        "Cookie": cookie,
        "Origin": "https://www.cruzverde.cl",
        "Referer": "https://www.cruzverde.cl/",
    }
    params = {
        "limit": 80,
        "offset": 0,
        "refine[]": f"cgid={cgid}",
    }

    urls = []
    while True:
        try:
            resp = httpx.get(BASE_API, params=params, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            for hit in data.get("hits", []):
                product_id = hit.get("productId")
                if product_id:
                    clean_path = cgid.replace("-medicamentos", "").replace("-", "/")
                    urls.append(f"{BASE_URL}/{clean_path}/{product_id}.html")

            if len(data.get("hits", [])) < 80:
                break

            params["offset"] += 80
            print(f"⏩ Más productos en {cgid}, offset: {params['offset']}")

        except Exception as e:
            print(f"❌ Failed to fetch {cgid}: {e}")
            break

    return urls


# Función principal
def main():
    with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
        categories = json.load(f)

    all_urls = {}
    cookie = get_cruzverde_cookie()

    for category, subcats in categories.items():
        if subcats:
            for subcat in subcats:
                print(f"🔍 Recolectando: {category}/{subcat}")
                cgid = f"{subcat}-{category}-medicamentos"
                urls = get_all_product_urls(cgid, cookie)
                if urls:
                    all_urls[f"{category}/{subcat}"] = urls
                    print(f"✅ {category}/{subcat}: {len(urls)} productos encontrados")
        else:
            print(f"🔍 Recolectando: {category} (sin subcategorías)")
            cgid = f"{category}-medicamentos"
            urls = get_all_product_urls(cgid, cookie)
            if urls:
                all_urls[category] = urls
                print(f"✅ {category}: {len(urls)} productos encontrados")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_urls, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
