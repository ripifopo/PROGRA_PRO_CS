import json
import httpx
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_API = "https://api.cruzverde.cl/product-service/products/search"
BASE_URL = "https://www.cruzverde.cl/medicamentos"
CATEGORIES_FILE = "cruzverde_categories.json"
OUTPUT_FILE = "cruzverde_product_urls.json"


# Obtener cookie de sesión con Playwright
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/medicamentos/", wait_until="networkidle")
        cookies = context.cookies()
        cookie_str = "; ".join([f"{c['name']}={c['value']}" for c in cookies])
        browser.close()
        return cookie_str


# Obtener URLs de los productos de una subcategoría
def get_all_product_urls(cgid, cookie):
    headers = {
        "Accept": "application/json",
        "Cookie": cookie,
        "Origin": "https://www.cruzverde.cl",
        "Referer": "https://www.cruzverde.cl/",
    }
    params = {
        "limit": 80,
        "offset": 0,
        "refine[]": f"cgid={cgid}",
    }

    urls = []
    while True:
        try:
            # Realizamos la solicitud
            resp = httpx.get(BASE_API, params=params, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            # Recopilamos los productos
            for hit in data.get("hits", []):
                product_id = hit.get("productId")
                if product_id:
                    clean_path = cgid.replace("-medicamentos", "").replace("-", "/")
                    urls.append(f"{BASE_URL}/{clean_path}/{product_id}.html")

            # Si la cantidad de productos obtenidos es menor que el límite, hemos llegado al final
            if len(data.get("hits", [])) < 80:
                break  # No hay más productos, terminamos

            # Si hay más de 150 productos, incrementamos el offset
            params["offset"] += 80  # Aumentamos el offset para la siguiente solicitud
            print(f"⏩ Más productos en {cgid}, offset: {params['offset']}")

        except Exception as e:
            print(f"❌ Failed to fetch {cgid}: {e}")
            break

    return urls


# Función principal
def main():
    with open(CATEGORIES_FILE, "r", encoding="utf-8") as f:
        categories = json.load(f)

    all_urls = {}
    cookie = get_cruzverde_cookie()

    # Iterar por todas las categorías y subcategorías
    for category, subcats in categories.items():
        if subcats:
            for subcat in subcats:
                cgid = f"{subcat}-{category}-medicamentos"
                urls = get_all_product_urls(cgid, cookie)
                if urls:
                    all_urls[f"{category}/{subcat}"] = urls
                    print(f"✅ {category}/{subcat}: {len(urls)} productos encontrados")
        else:
            cgid = f"{category}-medicamentos"
            urls = get_all_product_urls(cgid, cookie)
            if urls:
                all_urls[category] = urls
                print(f"✅ {category}: {len(urls)} productos encontrados")

    # Guardar los resultados en el archivo JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_urls, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
