import requests
import json
import re
from playwright.sync_api import sync_playwright

# 📄 Archivo de zonas (region, comuna → zoneId)
ZONES_FILE = "../zones/cruzverde_stock_locations.json"

# 🔐 Obtener cookie de sesión válida para la API
def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/ibuprofeno-600-mg-20-comprimidos/273362.html", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

# 🔢 Extraer ID del producto desde la URL
def extract_product_id(url):
    match = re.search(r'/(\d+)\.html', url)
    return match.group(1) if match else None

# 📍 Buscar zoneId para una comuna y región
def get_zone_id(region, comuna):
    with open(ZONES_FILE, "r", encoding="utf-8") as f:
        zones = json.load(f)

    for zona in zones:
        if zona["region"].strip().lower() == region.strip().lower() and \
           zona["commune"].strip().lower() == comuna.strip().lower():
            return zona["zoneId"]
    return None

# 🔎 Consultar stock desde la API con zona y producto
def consultar_stock(url_producto, region, comuna):
    product_id = extract_product_id(url_producto)
    if not product_id:
        print("❌ No se pudo extraer el product_id desde la URL.")
        return

    zone_id = get_zone_id(region, comuna)
    if not zone_id:
        print(f"❌ No se encontró zoneId para región '{region}' y comuna '{comuna}'.")
        return

    api_url = f"https://api.cruzverde.cl/product-service/products/detail/{product_id}?inventoryId={zone_id}"
    cookie = get_cruzverde_cookie()

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Cookie": cookie
    }

    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        product_data = data.get("productData", {})
        print(f"\n🧭 zoneId: {zone_id}")

        if "stock" in product_data:
            stock = product_data["stock"]
            print(f"📦 Stock en {comuna}, {region}: {stock} unidades")
        else:
            print("❓ Campo 'stock' no encontrado en la respuesta.")
    except Exception as e:
        print(f"❌ Error al consultar la API: {e}")

# 🧪 Menú interactivo por consola
if __name__ == "__main__":
    print("📦 CONSULTA DE STOCK – FARMACIA CRUZ VERDE")
    print("=========================================\n")

    url = input("🔗 URL del producto: ").strip()
    region = input("🌍 Región: ").strip()
    comuna = input("🏙️ Comuna: ").strip()

    print("\n🔎 Consultando stock...\n")
    consultar_stock(url, region, comuna)
