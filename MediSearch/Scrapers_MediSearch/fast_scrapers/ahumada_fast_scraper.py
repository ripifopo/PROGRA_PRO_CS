import json
import time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# Rutas de entrada/salida
INPUT_DIR = Path("../product_jsons_limpios/ahumada_jsons_limpios")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../product_updates/ahumada/{timestamp}")

# 🧠 Extraer precios desde el HTML según los 3 casos posibles
def extract_prices_from_html(soup):
    offer_price = None
    normal_price = None

    # Caso 1: Precio en oferta y precio normal (oferta real)
    promo = soup.select_one(".promotion-badge-container")
    strike = soup.select_one("span.strike-through.list.text-decoration-none span.value")
    if promo and strike and strike.has_attr("content"):
        try:
            normal_price = int(float(strike["content"]))
        except:
            normal_price = None

    # Precio oferta desde JSON-LD (prioritario si hay promo)
    json_ld_tag = soup.find("script", type="application/ld+json")
    if json_ld_tag:
        try:
            json_data = json.loads(json_ld_tag.string)
            if isinstance(json_data, dict) and "offers" in json_data:
                offer_price = int(float(json_data['offers']['price']))
        except:
            pass

    # Caso 2: Solo promoción sin tachado → solo offer_price válido
    if promo and not normal_price:
        normal_price = None

    # Caso 3: Solo un precio sin promoción
    if not promo and not normal_price:
        default_price_tag = soup.select_one("span.value.d-flex.align-items-center")
        if default_price_tag and default_price_tag.has_attr("content"):
            try:
                offer_price = int(float(default_price_tag["content"]))
            except:
                offer_price = None

    return offer_price, normal_price

# 🗂 Procesar un archivo de productos
def process_file(filepath, browser):
    with open(filepath, "r", encoding="utf-8") as f:
        products = json.load(f)

    if not products:
        return

    categoria = products[0].get("categoria")
    result = []

    page = browser.new_page()

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

    # Guardar resultados
    output_path = OUTPUT_DIR / f"{categoria}.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"✅ Guardado: {output_path}")

# 🚀 Ejecutar todo

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for file in INPUT_DIR.glob("*.json"):
            print(f"🔍 Procesando {file.name}...")
            process_file(file, browser)
        browser.close()

if __name__ == "__main__":
    main()
