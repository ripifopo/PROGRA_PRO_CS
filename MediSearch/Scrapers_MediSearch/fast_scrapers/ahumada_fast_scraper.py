from pathlib import Path
import json, time, re
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor, as_completed

# 📁 Directorios
BASE_DIR = Path(__file__).resolve().parent.parent.parent
INPUT_FILE = BASE_DIR / "url_extractor/extracted_urls/ahumada_urls.json"
OUTPUT_FILE = BASE_DIR / "product_updates/ahumada_products.jsonl"  # Archivo final único

# 🧠 Función para extraer datos del HTML
def extract_data(soup):
    main_container = soup.select_one("div.product-details-section")
    if not main_container:
        return None, None, None, None, 0, None, None

    name_tag = main_container.select_one("h1.product-name")
    name = name_tag.get_text(strip=True) if name_tag else None

    image_tag = soup.select_one("div.primary-images img[src]")
    image_url = image_tag["src"] if image_tag and image_tag.has_attr("src") else None

    raw_normal_price = None
    offer_price = None
    stock = None

    try:
        price_container = main_container.select_one("div.price")
        if price_container:
            strike_tag = price_container.select_one("span.strike-through span.value")
            if strike_tag and strike_tag.has_attr("content"):
                raw_normal_price = int(float(strike_tag["content"]))
            elif strike_tag:
                text = strike_tag.get_text(strip=True).replace('.', '')
                match = re.search(r'\$?(\d+)', text)
                if match:
                    raw_normal_price = int(match.group(1))

            if offer_price is None:
                for tag in price_container.select("span.value[content]"):
                    try:
                        val = int(float(tag["content"]))
                        if 100 <= val <= 10000000:
                            offer_price = val
                            break
                    except:
                        continue

        stock_element = main_container.select_one(".stock-info, .availability, [class*='stock']")
        if stock_element:
            stock_text = stock_element.get_text(strip=True).lower()
            if "disponible" in stock_text or "stock" in stock_text:
                stock = "available"
            elif "agotado" in stock_text or "sin stock" in stock_text:
                stock = "out_of_stock"
            else:
                stock = "unknown"
        else:
            buy_button = main_container.select_one(".add-to-cart, .buy-button, [class*='comprar']")
            stock = "available" if buy_button else "unknown"

    except Exception as e:
        print(f"Error extracting price: {e}")

    discount = 0
    if raw_normal_price and offer_price and raw_normal_price > offer_price:
        discount = round((1 - offer_price / raw_normal_price) * 100)

    bioequivalent = bool(main_container.select_one(".bioequivalent-badge-container"))
    return name, image_url, raw_normal_price, offer_price, discount, stock, bioequivalent

# 🧠 Extraer ID desde URL
def extract_id_from_url(url):
    match = re.search(r"-(\d+)\.html", url)
    return int(match.group(1)) if match else None

# 🔄 Procesamiento por categoría
def process_category(categoria, urls):
    cat = categoria.split("/")[0]
    subcat = categoria.split("/")[1] if "/" in categoria else None
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for url in urls:
            product_id = extract_id_from_url(url)
            try:
                page.goto(url, timeout=20000)
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(1000)
                soup = BeautifulSoup(page.content(), "html.parser")
                name, image, normal_price, offer_price, discount, stock, bioeq = extract_data(soup)

                results.append({
                    "pharmacy": "Farmacia Ahumada",
                    "id": product_id,
                    "url": url,
                    "offer_price": offer_price,
                    "normal_price": normal_price,
                    "discount": discount,
                    "name": name,
                    "category": cat,
                    "subcategory": subcat,
                    "image": image,
                    "stock": stock,
                    "bioequivalent": bioeq
                })
            except Exception as e:
                print(f"❌ Error con ID {product_id}: {e}")
            time.sleep(0.2)

        page.close()
        browser.close()

    if results:
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            for item in results:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"✅ Guardado: {OUTPUT_FILE}")

# 🚀 Ejecutar
def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        all_data = json.load(f)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(process_category, categoria, urls): categoria
            for categoria, urls in all_data.items()
        }
        for future in as_completed(futures):
            categoria = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {categoria}: {e}")

if __name__ == "__main__":
    main()
