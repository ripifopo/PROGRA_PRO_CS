import json
import re
import unicodedata
from pathlib import Path
from bs4 import BeautifulSoup

# 📂 Rutas
INPUT_BASE_DIR = Path("../product_jsons/ahumada_jsons")
OUTPUT_BASE_DIR = Path("../product_jsons_limpios/ahumada_jsons_limpios")
FORMS_FILE = Path("../dictionary/forms.json")

# 📚 Cargar diccionario de formas farmacéuticas
with open(FORMS_FILE, "r", encoding="utf-8") as f:
    forms_data = json.load(f)

def normalize(text):
    if not text:
        return ""
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8").lower()

def detect_form(text):
    for entry in forms_data:
        if entry["name"].lower() in text:
            return entry["name"].lower()
        for synonym in entry.get("synonyms", []):
            if synonym.lower() in text:
                return entry["name"].lower()
    return None

def clean_product(product):
    for field in ["name", "description", "brand", "active_ingredient", "pharmaceutical_form", "laboratory"]:
        product[field] = normalize(product.get(field) or "")

    joined_text = (product.get("name") or "") + " " + (product.get("description") or "")

    # 🧪 Medidas
    matches = re.findall(r"(\d+(?:[.,]\d+)?)\s*(mg|mcg|g|ml|iu)", joined_text)
    if matches:
        unit = matches[0][1]
        total = sum(float(val.replace(",", ".")) for val, u in matches if u == unit)
        product["measurement"] = str(int(total)) if total.is_integer() else str(total)
        product["measurement_unit"] = unit
    else:
        product["measurement"] = None
        product["measurement_unit"] = None

    # 🧮 Unidades
    unit_match = re.search(r"x\s?(\d+)\s?(comprimidos|capsulas|tabletas|unidades|ovulos)", joined_text)
    product["units"] = int(unit_match.group(1)) if unit_match else product.get("units", None)

    # 💊 Forma farmacéutica
    product["pharmaceutical_form"] = detect_form(joined_text) or product.get("pharmaceutical_form")

    # ❌ Campos no deseados
    product.pop("final_url", None)

    return product

# 🚀 Ejecutar limpieza por carpeta
for cat_dir in INPUT_BASE_DIR.iterdir():
    if not cat_dir.is_dir():
        continue
    categoria = cat_dir.name
    productos_finales = []
    for subcat_file in cat_dir.glob("*.json"):
        with open(subcat_file, "r", encoding="utf-8") as f:
            productos = json.load(f)
        productos_finales.extend([clean_product(p) for p in productos])

    out_path = OUTPUT_BASE_DIR / f"{categoria}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(productos_finales, f, indent=2, ensure_ascii=False)

print("✅ Limpieza completa por categoría.")
