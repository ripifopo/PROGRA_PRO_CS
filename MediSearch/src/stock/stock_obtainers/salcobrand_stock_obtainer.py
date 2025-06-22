import json
import requests
from pathlib import Path

# 📁 Rutas absolutas
BASE_PATH = Path(__file__).resolve().parent.parent.parent
ZONES_FILE = BASE_PATH / "zones" / "salcobrand_stock_locations.json"
URLS_FILE = BASE_PATH / "Scrapers_MediSearch" / "url_extractor" / "extracted_urls" / "salcobrand_urls.json"

# 🔍 Buscar state_id y región por comuna
def get_state_id_and_region(comuna: str):
    with open(ZONES_FILE, "r", encoding="utf-8") as f:
        zonas = json.load(f)
        for z in zonas:
            if z["commune"].strip().lower() == comuna.strip().lower():
                return z["state_id"], z["region"]
    return None, None

# 🔎 Obtener SKU a partir de la URL
def get_sku_from_url(url_producto: str):
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        for categoria in data.values():
            for item in categoria:
                if item["url"].strip() == url_producto.strip():
                    return item["sku"]
    return None

# 🚀 Función principal
def obtener_stock(url: str, comuna: str) -> str:
    sku = get_sku_from_url(url)
    if not sku:
        return "No se encontró el SKU para la URL proporcionada."

    state_id, region = get_state_id_and_region(comuna)
    if not state_id:
        return f"No se encontró state_id para la comuna '{comuna}'."

    api_url = f"https://salcobrand.cl/api/v2/products/store_stock?state_id={state_id}&sku={sku}"

    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, dict) and not data:
            return f"🔴 No hay stock para el producto en '{comuna.title()}'."
        elif isinstance(data, list):
            resultados = []
            for local in data:
                nombre_local = local.get("name", "Farmacia desconocida")
                stock_valor = local.get("stocks", {}).get(str(sku), 0)
                if isinstance(stock_valor, int) and stock_valor > 0:
                    resultados.append(f"{nombre_local} - Stock: {stock_valor}")
            return "\n".join(resultados) if resultados else f"🔴 Producto sin stock en '{comuna.title()}'."
        else:
            return "⚠️ Formato inesperado en respuesta de la API."

    except Exception as e:
        return f"❌ Error al consultar stock: {str(e)}"

# 🧪 Modo consola (opcional)
if __name__ == "__main__":
    url = input("🔗 URL del producto: ").strip()
    comuna = input("🏙️ Comuna: ").strip()
    print(obtener_stock(url, comuna))
