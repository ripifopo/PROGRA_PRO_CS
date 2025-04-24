# generador_jsons_cruzverde.py (agrupado por categoría y subcategoría)
import json
import re
import time
import httpx
from pathlib import Path
from collections import defaultdict
from playwright.sync_api import sync_playwright

INPUT_FILE = "../url_extractor/extracted_urls/cruzverde_urls.json"
OUTPUT_DIR = "../product_jsons/cruzverde_jsons"
API_BASE = "https://api.cruzverde.cl/product-service/products/detail/"
INVENTORY_ID = ""

# 🟢 Obtener cookie válida automáticamente
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/ibuprofeno-600-mg-20-comprimidos/273362.html", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

# 🔍 Extraer ID desde la URL
def extract_product_id(url):
    match = re.search(r"/(\d+)\.html", url)
    return match.group(1) if match else None

# 💾 Leer URLs
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    url_data = json.load(f)

grouped_data = defaultdict(lambda: defaultdict(list))  # categoría -> subcategoría -> lista de productos
cookie = get_cruzverde_cookie()

headers = {
    "Accept": "application/json",
    "Origin": "https://www.cruzverde.cl",
    "Referer": "https://www.cruzverde.cl/",
    "Cookie": cookie
}

# 🚀 Recolectar datos
for category_path, urls in url_data.items():
    categoria, subcategoria = category_path.split("/") if "/" in category_path else (category_path, None)
    for url in urls:
        product_id = extract_product_id(url)
        if not product_id:
            continue

        api_url = f"{API_BASE}{product_id}?inventoryId={INVENTORY_ID}"

        for attempt in range(2):  # máximo 2 intentos por producto
            try:
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
                data = r.json()
                data["url"] = url
                data["categoria"] = categoria
                data["subcategoria"] = subcategoria
                key = subcategoria or "sin-subcategoria"
                grouped_data[categoria][key].append(data)
                print(f"✅ {product_id} ({categoria}/{key})")
                break

            except Exception as e:
                print(f"⚠️ Error en {product_id}: {e}")
                break

        time.sleep(0.2)

# 💾 Guardar por categoría
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
for categoria, subcats in grouped_data.items():
    out_path = Path(OUTPUT_DIR) / f"{categoria}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(subcats, f, indent=2, ensure_ascii=False)
    print(f"📁 Guardado: {out_path.name} ({sum(len(v) for v in subcats.values())} productos)")

print(f"\n🏁 Proceso finalizado.")
