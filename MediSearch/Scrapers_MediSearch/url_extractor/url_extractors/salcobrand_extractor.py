import requests
import json
import time
from playwright.sync_api import sync_playwright

CATEGORIES_FILE = "../structured_categories/salcobrand_categories.json"
OUTPUT_FILE = "../extracted_urls/salcobrand_urls.json"

# Headers para la API de Algolia
HEADERS = {
    "x-algolia-api-key": "0259fe250b3be4b1326eb85e47aa7d81",
    "x-algolia-application-id": "GM3RP06HJG",
    "Content-Type": "application/json",
    "Origin": "https://salcobrand.cl",
    "Referer": "https://salcobrand.cl/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

ALGOLIA_URL = "https://gm3rp06hjg.algolia.net/1/indexes/*/queries"
INDEX_NAME = "sb_variant_production"
PRODUCT_URL_PREFIX = "https://salcobrand.cl/"

# Manejo de nombres para filtros exactos
def build_facet_filter(main, sub=None):
    if main == "dolor-fiebre-y-antiflamatorios":
        main_facet = "Dolor, fiebre y antiflamatorios"
    else:
        main_facet = main.replace('-', ' ').title()

    if sub:
        sub_facet = sub.replace('-', ' ').title()
        return f"Medicamentos > {main_facet} > {sub_facet}"
    else:
        return f"Medicamentos > {main_facet}"

# Recolección vía Algolia (usado por defecto)
def fetch_urls(main_cat, sub_cat):
    product_data = []
    page = 0
    while True:
        # 🔁 EXCEPCIÓN para categoría sin subcategoría (test-de-autodiagnostico)
        if main_cat == "test-de-autodiagnostico" and sub_cat is None:
            facet_filter = "Medicamentos > Test de autodiagnostico"
            facet_level = "lvl1"
        else:
            facet_filter = build_facet_filter(main_cat, sub_cat)
            facet_level = "lvl2"

        payload = {
            "requests": [
                {
                    "indexName": INDEX_NAME,
                    "params": f"clickAnalytics=true&facetFilters=[[\"product_categories.{facet_level}:{facet_filter}\"]]"
                              f"&facets=[]&filters=(timestamp_available_on < 1743975542)"
                              f"&hitsPerPage=100&page={page}"
                }
            ]
        }

        response = requests.post(ALGOLIA_URL, headers=HEADERS, json=payload)
        if response.status_code != 200:
            raise Exception(f"Error {response.status_code}")

        data = response.json()
        hits = data["results"][0].get("hits", [])
        if not hits:
            break

        for hit in hits:
            url_path = hit.get("url") or hit.get("slug") or hit.get("productUrl")
            product_id = hit.get("objectID")
            if url_path and product_id:
                full_url = url_path
                if not full_url.startswith("http"):
                    full_url = PRODUCT_URL_PREFIX + full_url.lstrip("/")
                product_data.append({
                    "url": full_url,
                    "objectID": str(product_id)
                })

        page += 1
        time.sleep(0.5)

    return product_data


# Recolección directa desde página SPA (caso especial: test-de-autodiagnostico)
def scrape_direct_from_page(url):
    print(f"🌐 Recolectando productos de test-de-autodiagnostico vía Algolia (lvl1)")
    product_data = []
    page = 0
    total = 0

    facet_filter = "Medicamentos > Test de autodiagnostico"

    while True:
        payload = {
            "requests": [
                {
                    "indexName": INDEX_NAME,
                    "params": f"clickAnalytics=true&facetFilters=[[\"product_categories.lvl1:{facet_filter}\"]]"
                              f"&facets=[]&filters=(timestamp_available_on < 1743975542)"
                              f"&hitsPerPage=100&page={page}"
                }
            ]
        }

        response = requests.post(ALGOLIA_URL, headers=HEADERS, json=payload)
        if response.status_code != 200:
            print(f"❌ Error {response.status_code} en solicitud Algolia")
            break

        data = response.json()
        hits = data["results"][0].get("hits", [])
        if not hits:
            break

        for hit in hits:
            url_path = hit.get("url") or hit.get("slug") or hit.get("productUrl")
            product_id = hit.get("objectID")
            name = hit.get("name", "[sin nombre]")
            if url_path and product_id:
                full_url = url_path
                if not full_url.startswith("http"):
                    full_url = PRODUCT_URL_PREFIX + full_url.lstrip("/")
                product_data.append({
                    "url": full_url,
                    "objectID": str(product_id)
                })
                print(f"🔹 {product_id} - {name} → {full_url}")
                total += 1

        page += 1
        time.sleep(0.3)

    print(f"\n✅ Total productos encontrados: {total}")
    return product_data


# Recolectar todas las categorías
with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
    categories = json.load(f)

result = {}

for main_cat, subcats in categories.items():
    if subcats:
        for sub_cat in subcats:
            print(f"🔍 Recolectando: {main_cat}/{sub_cat}")
            try:
                urls = fetch_urls(main_cat, sub_cat)
                result[f"{main_cat}/{sub_cat}"] = urls
                print(f"✅ {main_cat}/{sub_cat}: {len(urls)} productos encontrados")
            except Exception as e:
                print(f"⚠️ Error en {main_cat}/{sub_cat}: {e}")
                result[f"{main_cat}/{sub_cat}"] = []
    else:
        print(f"🔍 Recolectando: {main_cat} (sin subcategorías)")
        try:
            if main_cat == "test-de-autodiagnostico":
                urls = scrape_direct_from_page(f"https://salcobrand.cl/t/medicamentos/{main_cat}")
            else:
                urls = fetch_urls(main_cat, None)

            result[main_cat] = urls
            print(f"✅ {main_cat}: {len(urls)} productos encontrados")
        except Exception as e:
            print(f"⚠️ Error en {main_cat}: {e}")
            result[main_cat] = []

# Guardar resultado
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("✅ Recolección completa.")
