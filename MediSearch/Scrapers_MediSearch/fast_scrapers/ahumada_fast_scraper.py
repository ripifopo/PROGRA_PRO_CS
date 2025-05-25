import json
import time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from playwright.sync_api import sync_playwright

# Rutas de entrada/salida
INPUT_DIR = Path("../product_jsons_limpios/ahumada_jsons_limpios")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../product_updates/ahumada/{timestamp}")

# 🧠 Extraer precios desde el HTML según los 3 casos posibles
def extract_prices_from_html(soup):
    offer_price = None
    normal_price = None

    promo = soup.select_one(".promotion-badge-container")
    strike = soup.select_one("span.strike-through.list.text-decoration-none span.value")
    if promo and strike and strike.has_attr("content"):
        try:
            normal_price = int(float(strike["content"]))
        except:
            normal_price = None

    json_ld_tag = soup.find("script", type="application/ld+json")
    if json_ld_tag:
        try:
            json_data = json.loads(json_ld_tag.string)
            if isinstance(json_data, dict) and "offers" in json_data:
                offer_price = int(float(json_data['offers']['price']))
        except:
            pass

    if promo and not normal_price:
        normal_price = None

    if not promo and not normal_price:
        default_price_tag = soup.select_one("span.value.d-flex.align-items-center")
        if default_price_tag and default_price_tag.has_attr("content"):
            try:
                offer_price = int(float(default_price_tag["content"]))
            except:
                offer_price = None

    return offer_price, normal_price

# 🗂 Procesar un archivo de productos (por hilo)
def process_file(filepath):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        with open(filepath, "r", encoding="utf-8") as f:
            products = json.load(f)

        if not products:
            return

        categoria = products[0].get("categoria")
        result = []

        for product in products:
            product_id = product.get("id")
            url = product.get("url")
            farmacia = product.get("farmacia")

            try:
                page.goto(url, timeout=20000)
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(1000)
                html = page.content()
                soup = BeautifulSoup(html, "html.parser")

                offer_price, normal_price = extract_prices_from_html(soup)

                if offer_price and normal_price and normal_price > offer_price:
                    discount = round((1 - offer_price / normal_price) * 100)
                else:
                    discount = 0
                    normal_price = None

                result.append({
                    "id": product_id,
                    "farmacia": farmacia,
                    "url": url,
                    "price_offer": offer_price,
                    "price_normal": normal_price,
                    "discount": discount
                })

            except Exception as e:
                print(f"⚠️ Error en {product_id}: {e}")

            time.sleep(0.3)

        page.close()
        browser.close()

        # Guardar resultados
        output_path = OUTPUT_DIR / f"{categoria}.json"
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"✅ Guardado: {output_path}")

# 🚀 Ejecutar
def main():
    files = list(INPUT_DIR.glob("*.json"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_file, file): file.name for file in files}
        for future in as_completed(futures):
            name = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {name}: {e}")

if __name__ == "__main__":
    main()
