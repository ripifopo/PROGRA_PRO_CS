from pathlib import Path
import json, time, re
from datetime import datetime
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = Path(__file__).resolve().parent.parent.parent
INPUT_FILE = BASE_DIR / "Scrapers_MediSearch/url_extractor/extracted_urls/cruzverde_urls.json"
OUTPUT_FILE = BASE_DIR / "product_updates/cruzverde_products.jsonl"  # archivo único

def extract_data(soup):
    name_tag = soup.select_one("div.product-name h1")
    name = name_tag.get_text(strip=True) if name_tag else None

    image_tag = soup.select_one("img.productImage")
    image_url = image_tag["src"] if image_tag and image_tag.has_attr("src") else None

    price_block = soup.select_one("div.product-prices")
    raw_normal_price, offer_price = None, None

    if price_block:
        try:
            strike = price_block.select_one("span.price-standard span.value")
            if strike and strike.has_attr("content"):
                raw_normal_price = int(float(strike["content"]))
            else:
                strike_text = price_block.select_one("span.price-standard")
                if strike_text:
                    match = re.search(r'\$?(\d[\d\.]*)', strike_text.get_text(strip=True))
                    if match:
                        raw_normal_price = int(match.group(1).replace('.', ''))

            offer = price_block.select_one("span.price-sales span.value")
            if offer and offer.has_attr("content"):
                offer_price = int(float(offer["content"]))
            elif not offer:
                # fallback
                offer_text = price_block.select_one("span.price-sales")
                if offer_text:
                    match = re.search(r'\$?(\d[\d\.]*)', offer_text.get_text(strip=True))
                    if match:
                        offer_price = int(match.group(1).replace('.', ''))
        except Exception as e:
            print(f"Error extracting prices: {e}")

    discount = 0
    if raw_normal_price and offer_price and raw_normal_price > offer_price:
        discount = round((1 - offer_price / raw_normal_price) * 100)

    stock_info = soup.select_one(".availability")
    stock = "unknown"
    if stock_info:
        stock_text = stock_info.get_text(strip=True).lower()
        if "agotado" in stock_text or "sin stock" in stock_text:
            stock = "out_of_stock"
        elif "disponible" in stock_text or "stock" in stock_text:
            stock = "available"

    bioequivalent = bool(soup.select_one(".bioequivalent"))
    return name, image_url, raw_normal_price, offer_price, discount, stock, bioequivalent

def extract_id_from_url(url):
    match = re.search(r"-(\d+)\.html", url)
    return int(match.group(1)) if match else None

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
                    "pharmacy": "Cruz Verde",
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
