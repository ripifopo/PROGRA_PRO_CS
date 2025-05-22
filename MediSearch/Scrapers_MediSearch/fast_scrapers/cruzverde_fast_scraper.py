import os
import json
import httpx
import re
import time
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

# Ruta de entrada y salida
INPUT_DIR = Path("../product_jsons_limpios/cruzverde_jsons_limpios")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../product_updates/cruzverde/{timestamp}")

API_URL = "https://api.cruzverde.cl/product-service/products/detail/{}?inventoryId=zonaS2Soriente"

# 🔐 Obtener cookie válida automáticamente
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/ibuprofeno-600-mg-20-comprimidos/273362.html", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

# 🗂 Procesar un archivo JSON de productos
def process_file(filepath, headers):
    with open(filepath, "r", encoding="utf-8") as f:
        products = json.load(f)

    if not products:
        return []

    categoria = products[0].get("categoria")
    result = []

    for product in products:
        product_id = product.get("id")
        url = product.get("url")
        farmacia = product.get("farmacia")

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

                if price_normal and price_normal > price_offer:
                    discount = round((1 - price_offer / price_normal) * 100)
                else:
                    discount = 0

                result.append({
                    "id": product_id,
                    "farmacia": farmacia,
                    "url": url,
                    "price_offer": price_offer,
                    "price_normal": price_normal,
                    "discount": discount
                })
                break

            except Exception as e:
                print(f"⚠️ Error en {product_id}: {e}")
                break

            time.sleep(0.2)

    # Guardar resultados
    output_path = OUTPUT_DIR / f"{categoria}.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"✅ Guardado: {output_path}")

# 🚀 Ejecutar todo
def main():
    cookie = get_cruzverde_cookie()
    headers = {
        "Accept": "application/json",
        "Origin": "https://www.cruzverde.cl",
        "Referer": "https://www.cruzverde.cl/",
        "Cookie": cookie
    }

    for file in INPUT_DIR.glob("*.json"):
        print(f"🔍 Procesando {file.name}...")
        process_file(file, headers)

if __name__ == "__main__":
    main()
