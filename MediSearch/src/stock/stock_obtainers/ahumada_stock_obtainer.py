import json
from pathlib import Path
from playwright.sync_api import sync_playwright

# 📄 Ruta al archivo de zonas
ZONES_PATH = Path(__file__).parent.parent / "zones" / "ahumada_stock_locations.json"


# 🔎 Buscar región e inventory_zone según comuna
def get_region_and_zone_by_commune(commune):
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        zones = json.load(f)
    for entry in zones:
        if entry["commune"].strip().lower() == commune.strip().lower():
            return entry["region"], entry["inventory_zone"]
    return None, None


# 🔍 Función principal exportable
def obtener_stock(product_url: str, comuna: str) -> str:
    region, inventory_zone = get_region_and_zone_by_commune(comuna)
    if not region or not inventory_zone:
        return f"❌ Zona no encontrada para comuna: {comuna}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 🌐 Visitar página base para establecer sesión
            page.goto("https://www.farmaciasahumada.cl", wait_until="domcontentloaded")

            # 📡 Enviar zona
            page.evaluate(f"""
                fetch("/on/demandware.store/Sites-ahumada-cl-Site/default/Stores-SaveZone", {{
                    method: "POST",
                    headers: {{
                        "Content-Type": "application/x-www-form-urlencoded"
                    }},
                    body: "state={region}&city={comuna}"
                }});
            """)

            page.wait_for_timeout(1000)

            # 🔄 Cargar página del producto
            page.goto(product_url, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # 🔎 Verificar si hay mensaje de "sin stock"
            no_stock = page.locator(".no-stock-message")
            stock = "Producto sin stock" if no_stock.count() > 0 else "Disponible"

            return f"📦 [{region} / {comuna}] → Stock: {stock}. *Farmacia Ahumada solo muestra stock online, no por tienda física"

        except Exception as e:
            return f"❌ Error durante el proceso: {e}"

        finally:
            browser.close()


# 🧪 Modo interactivo
if __name__ == "__main__":
    url = input("🔗 Ingresa la URL del producto: ").strip()
    comuna = input("🏙️ Ingresa la comuna: ").strip()
    print(obtener_stock(url, comuna))
