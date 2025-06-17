import json
import requests

# 📄 Rutas
ZONES_FILE = "../../zones/salcobrand_stock_locations.json"
URLS_FILE = "../../../Scrapers_MediSearch/url_extractor/extracted_urls/salcobrand_urls.json"

# 🔍 Buscar state_id y región según comuna
def get_state_id_and_region(comuna):
    with open(ZONES_FILE, "r", encoding="utf-8") as f:
        zonas = json.load(f)
        for z in zonas:
            if z["commune"].strip().lower() == comuna.strip().lower():
                return z["state_id"], z["region"]
    return None, None

# 🔍 Buscar sku según la URL
def get_sku_from_url(url_producto):
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for categoria in data.values():
            for item in categoria:
                if item["url"].strip() == url_producto.strip():
                    return item["sku"]
    return None

# 🧾 Inputs desde consola
print("📦 CONSULTA DE STOCK – SALCOBRAND")
print("=================================\n")
url = input("🔗 URL del producto: ").strip()
comuna = input("🏙️ Comuna: ").strip()

# 🎯 Obtener SKU
sku = get_sku_from_url(url)
if not sku:
    print("❌ No se encontró SKU para la URL proporcionada.")
    exit()

# 🎯 Obtener state_id y región
state_id, region = get_state_id_and_region(comuna)
if not state_id:
    print(f"❌ No se encontró state_id para la comuna '{comuna}'.")
    exit()

# 🌐 Consultar API
api_url = f"https://salcobrand.cl/api/v2/products/store_stock?state_id={state_id}&sku={sku}"
print(f"\n📡 Consultando: {api_url}\n")

try:
    response = requests.get(api_url, timeout=10)
    response.raise_for_status()
    data = response.json()

    if isinstance(data, dict) and not data:
        print("🔴 No hay stock en ninguna farmacia de la comuna.")
    elif isinstance(data, list):
        found = False
        for local in data:
            stock = local.get("stocks", {}).get(str(sku), 0)
            if isinstance(stock, int) and stock > 0:
                print(f"{local.get('name')} → Stock: {stock}")
                found = True
        if not found:
            print("🔴 Producto sin stock en las farmacias de esta comuna.")
    else:
        print("❓ Formato inesperado de respuesta.")
except Exception as e:
    print(f"❌ Error al consultar la API: {e}")
