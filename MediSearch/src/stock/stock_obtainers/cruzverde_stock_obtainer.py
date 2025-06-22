import requests
import json
import re
from playwright.sync_api import sync_playwright

# 🔐 Obtener cookie de sesión válida desde el navegador
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/ibuprofeno-600-mg-20-comprimidos/273362.html", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

# 🔎 Extraer productId desde la URL
def extract_product_id(url):
    match = re.search(r'/(\d+)\.html', url)
    return match.group(1) if match else None

# 🚀 Función principal que obtiene el stock por comuna
def obtener_stock(url_producto: str, comuna: str) -> str:
    product_id = extract_product_id(url_producto)
    if not product_id:
        return "No se pudo extraer el ID del producto desde la URL."

    comuna_formateada = comuna.strip().lower().replace(" ", "")
    api_url = f"https://api.cruzverde.cl/product-service/products/stores-stock?id={comuna_formateada}&productId={product_id}"

    try:
        cookie = get_cruzverde_cookie()
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Cookie": cookie
        }

        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        stores = data.get("stores", [])
        if not stores:
            return "No se encontraron tiendas o no hay stock en la comuna."

        resultado = []
        for store in stores:
            address = store.get("address", "Dirección desconocida")
            stock = store.get("stock", 0)
            resultado.append(f"{address}: {stock} unidades")

        return " | ".join(resultado)

    except Exception as e:
        return f"Error consultando stock: {str(e)}"

# 🧪 Ejecución directa desde consola
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Uso: python cruzverde_stock.py <url_producto> <comuna>")
    else:
        url = sys.argv[1]
        comuna = sys.argv[2]
        print(obtener_stock(url, comuna))
