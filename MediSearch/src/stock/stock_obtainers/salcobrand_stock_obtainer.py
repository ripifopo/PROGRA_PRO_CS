import json
import requests
from pathlib import Path

# 📄 Rutas
BASE_PATH = Path(__file__).resolve().parent.parent.parent  # stock_obtainers/
ZONES_FILE = BASE_PATH / "zones" / "salcobrand_stock_locations.json"
URLS_FILE = BASE_PATH / "Scrapers_MediSearch" / "url_extractor" / "extracted_urls" / "salcobrand_urls.json"

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

# 🚀 Función principal invocable por stock_checker
def obtener_stock(url: str, comuna: str) -> str:
    sku = get_sku_from_url(url)
    if not sku:
        return "❌ No se encontró SKU para la URL proporcionada."

    state_id, region = get_state_id_and_region(comuna)
    if not state_id:
        return f"❌ No se encontró state_id para la comuna '{comuna}'."

    api_url = f"https://salcobrand.cl/api/v2/products/store_stock?state_id={state_id}&sku={sku}"

    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, dict) and not data:
            return "🔴 No hay stock en ninguna farmacia de la comuna."
        elif isinstance(data, list):
            resultados = [
                f"{local.get('name')} → Stock: {local.get('stocks', {}).get(str(sku), 0)}"
                for local in data
                if isinstance(local.get("stocks", {}).get(str(sku)), int) and local["stocks"][str(sku)] > 0
            ]
            return "\n".join(resultados) if resultados else "🔴 Producto sin stock en las farmacias de esta comuna."
        else:
            return "❓ Formato inesperado de respuesta."
    except Exception as e:
        return f"❌ Error al consultar la API: {e}"
