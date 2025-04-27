import json
import re
import os
import unicodedata

# 📂 Rutas
CATEGORY_FILE = "../url_extractor/structured_categories/cruzverde_categories.json"
INPUT_BASE_DIR = "../product_jsons/cruzverde_jsons"
OUTPUT_BASE_DIR = "../product_jsons_limpios/cruzverde_jsons_limpios"
UNITS_FILE = "../dictionary/units.json"
FORMS_FILE = "../dictionary/forms.json"

# 🔣 Normalizar texto (sin tildes, lowercase)
def normalize(text):
    if not text:
        return ""
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8").lower()

# 🏷️ Construir URL final del producto
def build_final_url(name, product_id):
    normalized = normalize(name)
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return f"https://www.cruzverde.cl/{slug}/{product_id}.html"

# 📚 Cargar diccionarios
with open(UNITS_FILE, "r", encoding="utf-8") as f:
    units_dict = json.load(f)
with open(FORMS_FILE, "r", encoding="utf-8") as f:
    forms_dict = json.load(f)

# 🔍 Extraer unidad, cantidad y forma
def detect_measurement_and_form(name):
    text = normalize(name)
    measurement = None
    measurement_unit = None
    units = None
    pharmaceutical_form = None

    for unit in units_dict:
        for synonym in unit["synonyms"]:
            match = re.search(r"(\d+(?:,\d+)?)[ ]?" + re.escape(synonym), text)
            if match:
                measurement = match.group(1).replace(",", ".")
                measurement_unit = unit["name"]
                break
        if measurement_unit:
            break

    for form in forms_dict:
        for synonym in form["synonyms"]:
            match = re.search(r"(\d+)[ ]?" + re.escape(synonym), text)
            if match:
                units = int(match.group(1))
                pharmaceutical_form = form["name"]
                break
        if pharmaceutical_form:
            break

    return measurement, measurement_unit, units, pharmaceutical_form

# 🧼 Limpiar producto
def clean_cruzverde_product(item):
    data = item.get("productData", {})
    name = data.get("name", "")
    product_id = int(data.get("id", 0))

    image = None
    if data.get("imageGroups"):
        images = data["imageGroups"][0].get("images", [])
        if images:
            image = images[0].get("link")

    normal_price = data.get("price", 0)
    sale_price = data.get("prices", {}).get("price-sale-cl")

    if sale_price and sale_price < normal_price:
        offer_price = sale_price
        discount = round((1 - (sale_price / normal_price)) * 100)
    else:
        offer_price = None
        discount = 0

    measurement, measurement_unit, units, pharmaceutical_form = detect_measurement_and_form(name)

    return {
        "id": product_id,
        "farmacia": "cruzverde",
        "url": build_final_url(name, product_id),  # ✅ URL limpia y correcta
        "categoria": item.get("categoria"),
        "subcategoria": item.get("subcategoria"),
        "name": name,
        "image": image,
        "offer_price": offer_price,
        "normal_price": normal_price,
        "discount": discount,
        "prescription_required": "Yes" if data.get("prescription") else "No",
        "laboratory": data.get("laboratory"),
        "brand": data.get("brand"),
        "active_ingredient": data.get("activeIngredient"),
        "measurement": measurement,
        "measurement_unit": measurement_unit,
        "units": units,
        "pharmaceutical_form": pharmaceutical_form,
        "description": data.get("pageDescription")
    }

# 🚀 Ejecutar limpieza
with open(CATEGORY_FILE, "r", encoding="utf-8") as f:
    categories = json.load(f)

for category_name in categories:
    input_path = os.path.join(INPUT_BASE_DIR, f"{category_name}.json")
    output_path = os.path.join(OUTPUT_BASE_DIR, f"{category_name}.json")

    if not os.path.exists(input_path):
        print(f"⚠️  No se encontró: {input_path}")
        continue

    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    cleaned = []
    for subcat, products in raw_data.items():
        for prod in products:
            cleaned.append(clean_cruzverde_product(prod))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=2, ensure_ascii=False)

    print(f"✅ {category_name}.json procesado ({len(cleaned)} productos)")
