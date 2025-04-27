import json
import requests
from pathlib import Path
import time

CATEGORIES_FILE = "../url_extractor/extracted_urls/salcobrand_urls.json"
OUTPUT_DIR = "../product_jsons/salcobrand_jsons"

# Obtener el JSON crudo desde la API de Salcobrand
def fetch_product_data(product_id):
    url = f"https://salcobrand.cl/api/v2/products/{product_id}"
    try:
        r = requests.get(url, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None

# Leer el archivo con URLs + objectID
with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# Agrupar por categoría
grouped_data = {}

for cat_key, items in data.items():
    if "/" in cat_key:
        categoria, subcategoria = cat_key.split("/", 1)
    else:
        categoria = cat_key
        subcategoria = None

    if categoria not in grouped_data:
        grouped_data[categoria] = []

    for item in items:
        product_id = item.get("objectID")
        if not product_id:
            continue

        raw_data = fetch_product_data(product_id)
        if raw_data:
            raw_data["url"] = item.get("url")  # opcional: guardar la URL de donde vino
            raw_data["categoria"] = categoria
            raw_data["subcategoria"] = subcategoria
            grouped_data[categoria].append(raw_data)
            print(f"✅ {product_id} ({categoria})")

        time.sleep(0.2)

# Guardar por categoría
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

for categoria, productos in grouped_data.items():
    out_path = Path(OUTPUT_DIR) / f"{categoria}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(productos, f, indent=2, ensure_ascii=False)
    print(f"📁 Guardado: {out_path.name} ({len(productos)} productos)")

print("\n🏁 Proceso finalizado.")
