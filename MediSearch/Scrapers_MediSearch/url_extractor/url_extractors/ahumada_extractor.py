import json
import httpx
import re
from bs4 import BeautifulSoup
from urllib.parse import quote

CATEGORIES_FILE = "../structured_categories/ahumada_categories.json"
OUTPUT_FILE = "../extracted_urls/ahumada_urls.json"
API_BASE = "https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/default/Search-UpdateGrid"

with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
    categories = json.load(f)

result = {}
errors = {}

# 🔧 Eliminar sufijos -1, -2 si es necesario
def normalize_subcat(subcat):
    # Solo elimina si el guion antes del número es simple (no doble o triple)
    return re.sub(r"(?<!-)-\d+$", "", subcat)

# 🧠 Convertir categoría/subcategoría a cgid codificado correctamente
def get_cgid(category, subcat=None):
    if subcat:
        subcat_clean = normalize_subcat(subcat)

        # Caso especial: dolor--fiebre-e-inflamacion requiere coma codificada como %2c y guión posterior
        if category == "dolor--fiebre-e-inflamacion":
            raw = f"medicamentos-dolor,-fiebre-e-inflamacion-{subcat_clean}"
            return raw.replace(",", "%2c")  # asegura coma codificada en minúscula

        # Caso general
        raw = f"medicamentos-{category}-{subcat_clean}"
        return quote(raw, safe="")

    else:
        raw = f"medicamentos-{category}"
        return quote(raw, safe="")

def collect_urls(category, subcat=None):
    route = f"{category}/{subcat}" if subcat else category

    # 🟡 CASO 1: Excepción exacta para 'inductores-del-sueno'
    if category == "sistema-nervioso" and subcat == "inductores-del-sueno":
        api_url = (
            "https://www.farmaciasahumada.cl/on/demandware.store/"
            "Sites-ahumada-cl-Site/default/Search-UpdateGrid"
            "?cgid=medicamentos-sistema-nervioso-inductores-del-sue%C3%B1o"
            "&start=0&sz=300"
        )
    else:
        cgid = get_cgid(category, subcat)
        api_url = f"{API_BASE}?cgid={cgid}&start=0&sz=300"

    print(f"🔍 Visitando: {route}")
    print(f"🌐 URL generada: {api_url}")

    try:
        resp = httpx.get(api_url, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        links = [a["href"] for a in soup.select("a[href$='.html']") if a["href"].startswith("/")]
        product_links = {f"https://www.farmaciasahumada.cl{href}" for href in links}

        if product_links:
            result[route] = sorted(product_links)
            print(f"✅ {route}: {len(product_links)} productos encontrados")
        else:
            errors[route] = "0 productos encontrados"
            print(f"⚠️ {route}: 0 productos encontrados")
    except Exception as e:
        errors[route] = str(e)
        print(f"❌ Error en {route}: {e}")

# ▶️ Recolectar URLs
for category, subcats in categories.items():
    if subcats:
        for subcat in subcats:
            collect_urls(category, subcat)
    else:
        collect_urls(category)

# 💾 Guardar resultados
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("\n🏁 Proceso completado.")
