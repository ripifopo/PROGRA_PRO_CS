import requests
import json
import time

# Cargar categorías desde JSON
with open("salcobrand_categories.json", "r", encoding="utf-8") as f:
    categories = json.load(f)

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

def build_facet_filter(main, sub=None):
    if sub:
        return f"Medicamentos > {main.replace('-', ' ').title()} > {sub.replace('-', ' ').title()}"
    else:
        return f"Medicamentos > {main.replace('-', ' ').title()}"

def fetch_urls(main_cat, sub_cat):
    urls = []
    page = 0
    while True:
        facet_filter = build_facet_filter(main_cat, sub_cat)
        payload = {
            "requests": [
                {
                    "indexName": INDEX_NAME,
                    "params": f"clickAnalytics=true&facetFilters=[[\"product_categories.lvl2:{facet_filter}\"]]"
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
            url = hit.get("url") or hit.get("slug") or hit.get("productUrl")
            if url:
                if not url.startswith("http"):
                    url = PRODUCT_URL_PREFIX + url.lstrip("/")
                urls.append(url)

        page += 1
        time.sleep(0.5)

    return urls

# Recolectar URLs
result = {}

for main_cat, subcats in categories.items():
    if subcats:
        for sub_cat in subcats:
            print(f"🔍 Recolectando: {main_cat}/{sub_cat}")
            try:
                urls = fetch_urls(main_cat, sub_cat)
                result[f"{main_cat}/{sub_cat}"] = urls
            except Exception as e:
                print(f"⚠️ Error en {main_cat}/{sub_cat}: {e}")
                result[f"{main_cat}/{sub_cat}"] = []
    else:
        print(f"🔍 Recolectando: {main_cat} (sin subcategorías)")
        try:
            urls = fetch_urls(main_cat, None)
            result[main_cat] = urls
        except Exception as e:
            print(f"⚠️ Error en {main_cat}: {e}")
            result[main_cat] = []

# Guardar resultado
with open("salcobrand_product_urls.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("✅ Recolección completa.")
