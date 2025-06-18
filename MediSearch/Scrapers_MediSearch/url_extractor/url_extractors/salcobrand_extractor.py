import requests
import json
import time

CATEGORIES_FILE = "../structured_categories/salcobrand_categories.json"
OUTPUT_FILE = "../extracted_urls/salcobrand_urls.json"

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
PRODUCT_URL_PREFIX = "https://salcobrand.cl/products/"

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

def fetch_urls(main_cat, sub_cat):
    product_data = []
    page = 0
    while True:
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
            slug = hit.get("url") or hit.get("slug") or hit.get("productUrl")
            objectID = hit.get("objectID")
            sku = hit.get("sku") or objectID
            if slug and sku:
                full_url = PRODUCT_URL_PREFIX + slug.lstrip("/")
                product_data.append({
                    "url": full_url,
                    "objectID": str(objectID),
                    "sku": str(sku)
                })

        page += 1
        time.sleep(0.5)

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
