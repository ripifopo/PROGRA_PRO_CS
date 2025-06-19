import json
import time
from datetime import datetime
from pathlib import Path
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed

# Rutas corregidas
INPUT_FILE = Path("../Scrapers_MediSearch/url_extractor/extracted_urls/salcobrand_urls.json")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../Scrapers_MediSearch/product_updates/salcobrand/{timestamp}")
API_URL_TEMPLATE = "https://api.retailrocket.net/api/1.0/partner/602bba6097a5281b4cc438c9/items/?itemsIds={}&stock=&format=json"

# Extraer y transformar producto desde RetailRocket
def parse_rr_product(product_data, sku, cat_key, url, api_url):
    offer_raw = product_data.get("Price")
    offer_price = int(float(offer_raw)) if offer_raw else None

    old_price_raw = product_data.get("OldPrice")
    normal_price = int(float(old_price_raw)) if old_price_raw and offer_price and old_price_raw > offer_price else None

    discount = round((1 - offer_price / normal_price) * 100) if normal_price else 0

    name = product_data.get("Name")
    image = product_data.get("PictureUrl")
    bioequivalent = product_data.get("Params", {}).get("bioequivalent")

    if url and not url.startswith("http"):
        url = "https://salcobrand.cl" + url

    # Separar categoría y subcategoría
    parts = cat_key.split("/")
    category = parts[0]
    subcategory = parts[1] if len(parts) > 1 else None

    return {
        "pharmacy": "Salcobrand",
        "id": sku,
        "url": url,
        "api_url": api_url,
        "offer_price": offer_price,
        "normal_price": normal_price,
        "discount": discount,
        "name": name,
        "category": category,
        "subcategory": subcategory,
        "image": image,
        "bioequivalent": bioequivalent
    }


# Procesar una categoría
def process_category(cat_key, products):
    category_results = {}

    for product in products:
        sku = product.get("sku")
        url = product.get("url")
        if not sku:
            continue

        try:
            api_url = API_URL_TEMPLATE.format(sku)
            r = httpx.get(api_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            r.raise_for_status()
            data = r.json()

            if not data or not isinstance(data, list):
                print(f"❌ SKU {sku} sin datos")
                continue

            parsed = parse_rr_product(data[0], sku, cat_key, url, api_url)

            category = parsed["category"]
            if category not in category_results:
                category_results[category] = []
            category_results[category].append(parsed)

        except Exception as e:
            print(f"⚠️ Error en SKU {sku}: {e}")

        time.sleep(0.7)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for category, items in category_results.items():
        output_path = OUTPUT_DIR / f"{category}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)
        print(f"✅ Guardado: {output_path}")


# Ejecutar en paralelo
def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_category, cat_key, items): cat_key for cat_key, items in data.items()}
        for future in as_completed(futures):
            cat_key = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {cat_key}: {e}")

if __name__ == "__main__":
    main()
