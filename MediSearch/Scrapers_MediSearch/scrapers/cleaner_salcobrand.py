import json
import re
import unicodedata
from pathlib import Path
from bs4 import BeautifulSoup

INPUT_DIR = "../product_jsons/salcobrand_jsons"
OUTPUT_DIR = "../product_jsons_limpios/salcobrand_jsons_limpios"
UNITS_FILE = "../dictionary/units.json"
FORMS_FILE = "../dictionary/forms.json"
URL_ID_FILE = "../url_extractor/extracted_urls/salcobrand_urls.json"

# 📚 Cargar diccionarios
with open(UNITS_FILE, "r", encoding="utf-8") as f:
    units_data = json.load(f)
with open(FORMS_FILE, "r", encoding="utf-8") as f:
    forms_data = json.load(f)
with open(URL_ID_FILE, "r", encoding="utf-8") as f:
    url_data = json.load(f)

# 🔢 Construir diccionario url → id
url_to_id = {}
counter = 0
for _, productos in url_data.items():
    for p in productos:
        fixed_url = p["url"].replace("https://salcobrand.cl/", "https://salcobrand.cl/products/")
        url_to_id[fixed_url] = counter
        counter += 1

# 🔣 Funciones auxiliares
def normalize(text):
    if not text:
        return None
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8").strip()

def extract_number_and_unit(text):
    matches = re.findall(r"(\d+(?:[\.,]\d+)?)\s*([a-zA-Zμµ]+)", text)
    if matches:
        values = [match[0].replace(",", ".") for match in matches]
        units = [match[1] for match in matches]
        unit = next((u["name"] for u in units_data if any(s in units for s in [u["name"]] + u.get("synonyms", []))), None)
        return ", ".join(values), unit
    return None, None

def detect_pharmaceutical_form(text):
    if not text:
        return None
    norm_text = normalize(text)
    for f in forms_data:
        form_name = normalize(f["name"])
        if form_name and form_name in norm_text:
            return f["name"]
        for syn in f.get("synonyms", []):
            if normalize(syn) in norm_text:
                return f["name"]
    return None

def clean_html_description(raw_html):
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator="\n").strip()

def extract_units_from_text(text):
    if not text:
        return None
    text = normalize(text)
    matches = re.findall(r"(?:x\s*)?(\d{1,4})\s+(?:de\s+)?([a-zA-Z]+)", text)
    if not matches:
        return None

    for number, word in matches:
        for form in forms_data:
            if normalize(form["name"]) in word:
                return int(number)
            for syn in form.get("synonyms", []):
                if normalize(syn) in word:
                    return int(number)
    return None

# 🧼 Limpieza de producto
def clean_product(product):
    name = normalize(product.get("name"))
    brand = normalize(product.get("brand"))
    desc_raw = product.get("description") or ""
    short = normalize(product.get("short_description"))
    description = clean_html_description(desc_raw) if desc_raw else None

    offer = float(product.get("price") or 0)
    normal = float(product.get("badge", {}).get("raw_final_price") or offer)
    discount = round((normal - offer) / normal * 100, 2) if normal > offer else 0.0

    form = detect_pharmaceutical_form(short) or detect_pharmaceutical_form(description)
    quantity, unit = extract_number_and_unit(short or "") if short else (None, None)
    prescription_required = "Yes" if "receta" in (description or "").lower() else "No"

    img = None
    if isinstance(product.get("images"), list) and product["images"]:
        img = product["images"][0].get("original_url")

    fixed_url = product.get("url").replace("https://salcobrand.cl/", "https://salcobrand.cl/products/") if product.get("url") else None
    product_id = int(product.get("id", -1))

    return {
        "id": product_id,
        "farmacia": "salcobrand",
        "url": fixed_url,
        "categoria": product.get("categoria"),
        "subcategoria": product.get("subcategoria"),
        "name": name,
        "image": img,
        "offer_price": offer,
        "normal_price": normal,
        "discount": discount,
        "prescription_required": prescription_required,
        "laboratory": brand,
        "brand": brand,
        "active_ingredient": normalize(product.get("active_ingredient")),
        "measurement": quantity,
        "measurement_unit": unit,
        "units": extract_units_from_text(product.get("name")) or extract_units_from_text(description),
        "pharmaceutical_form": form,
        "description": description
    }

# 🚀 Ejecutar limpieza
Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

for file in Path(INPUT_DIR).glob("*.json"):
    with open(file, "r", encoding="utf-8") as f:
        raw_products = json.load(f)

    cleaned_products = [clean_product(p) for p in raw_products]

    out_path = Path(OUTPUT_DIR) / file.name
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_products, f, indent=2, ensure_ascii=False)

    print(f"🧼 Limpieza completa: {file.name} → {out_path.name}")

print("\n✅ Todos los archivos fueron limpiados.")
