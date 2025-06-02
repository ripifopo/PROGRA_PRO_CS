import json
import time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import re

INPUT_DIR = Path("../product_jsons_limpios/ahumada_jsons_limpios")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../product_updates/ahumada/{timestamp}")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def extract_price_only(soup):
    main_container = soup.select_one("div.product-details-section")
    if not main_container:
        return None, None, 0, False, None

    raw_normal_price = None
    offer_price = None
    stock = None

    try:
        price_container = main_container.select_one("div.price")
        if price_container:
            # Extraer normal_price
            strike_tag = price_container.select_one("span.strike-through span.value")
            if strike_tag and strike_tag.has_attr("content"):
                raw_normal_price = int(float(strike_tag["content"]))
            elif strike_tag:
                strike_text = strike_tag.get_text(strip=True)
                clean_text = strike_text.replace('.', '')
                price_match = re.search(r'\$?(\d+)', clean_text)
                if price_match:
                    raw_normal_price = int(price_match.group(1))

            # Intento 1: Texto completo "$19.932 15% dcto todos los días"
            for tag in price_container.select("span"):
                text = tag.get_text(strip=True)
                if re.search(r"\$\d{1,3}(?:\.\d{3})*\s+\d{1,2}%\s+dcto", text.lower()):
                    for tag in price_container.select("span"):
                        text = tag.get_text(strip=True)
                        price_match = re.search(r"\$(\d{1,3}(?:\.\d{3})*)", text)
                        if price_match:
                            offer_price = int(price_match.group(1).replace(".", ""))
                            break
                    break

            # Intento 2: Fallback a content numérico <span class="value" content="7159">
            if offer_price is None:
                for tag in price_container.select("span.value[content]"):
                    try:
                        val = int(float(tag["content"]))
                        if 100 <= val <= 10000000:
                            offer_price = val
                            break
                    except:
                        continue

        # Stock
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

    normal_price = raw_normal_price if raw_normal_price else None
    discount = 0
    if isinstance(offer_price, int) and isinstance(normal_price, int):
        if normal_price > offer_price:
            discount = round((1 - offer_price / normal_price) * 100)

    bioequivalent = bool(main_container.select_one(".bioequivalent-badge-container"))

    return normal_price, offer_price, discount, bioequivalent, stock


def extract_id_from_url(url):
    match = re.search(r"-(\d+)\.html", url)
    return int(match.group(1)) if match else None


def process_file(filepath):
    result = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        with open(filepath, "r", encoding="utf-8") as f:
            products = json.load(f)

        if not products:
            return

        categoria = products[0].get("categoria")

        for product in products:
            url = product.get("url")
            farmacia = product.get("farmacia", "Farmacia Ahumada")
            product_id = extract_id_from_url(url)

            try:
                page.goto(url, timeout=20000)
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(1000)
                soup = BeautifulSoup(page.content(), "html.parser")

                # Variables are now swapped in the function call order
                normal_price, offer_price, discount, bioequivalent, stock = extract_price_only(soup)

                result.append({
                    "pharmacy": farmacia,
                    "id": product_id,
                    "url": url,
                    "offer_price": offer_price,    # Now receives what was normal_price
                    "normal_price": normal_price,  # Now receives what was offer_price
                    "discount": discount,
                    "name": product.get("name", ""),
                    "category": product.get("categoria", ""),
                    "subcategory": product.get("subcategoria", ""),
                    "image": product.get("image", ""),
                    "stock": stock
                })

            except Exception as e:
                print(f"❌ Error con ID {product_id}: {e}")

            time.sleep(0.2)

        page.close()
        browser.close()

    if result:
        filename = categoria + ".json"
        output_path = OUTPUT_DIR / filename
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"✅ Guardado: {output_path}")


def main():
    files = list(INPUT_DIR.glob("*.json"))

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(process_file, file): file.name
            for file in files
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {name}: {e}")


if __name__ == "__main__":
    main()