import json
from pathlib import Path
from playwright.sync_api import sync_playwright

# Ruta al archivo de zonas
ZONES_PATH = Path(__file__).parent.parent / "zones" / "ahumada_stock_locations.json"

def get_region_and_zone_by_commune(commune):
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        zones = json.load(f)
    for entry in zones:
        if entry["commune"].strip().lower() == commune.strip().lower():
            return entry["region"], entry["inventory_zone"]
    return None, None

def get_stock_info(product_url: str, commune: str):
    region, inventory_zone = get_region_and_zone_by_commune(commune)
    if not region or not inventory_zone:
        print(f"❌ Zona no encontrada para comuna: {commune}")
        return

    print(f"📍 Zona seleccionada: {region} / {commune} → {inventory_zone}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("🌐 Abriendo sitio base de Ahumada...")
        page.goto("https://www.farmaciasahumada.cl", wait_until="domcontentloaded")

        print("📡 Enviando zona desde el navegador...")
        page.evaluate(f"""
            fetch("/on/demandware.store/Sites-ahumada-cl-Site/default/Stores-SaveZone", {{
                method: "POST",
                headers: {{
                    "Content-Type": "application/x-www-form-urlencoded"
                }},
                body: "state={region}&city={commune}"
            }});
        """)

        page.wait_for_timeout(1000)

        print("🔄 Cargando producto...")
        try:
            page.goto(product_url, wait_until="domcontentloaded")
        except Exception as e:
            print(f"❌ Error al cargar producto: {e}")
            browser.close()
            return

        page.wait_for_timeout(3000)

        no_stock = page.locator(".no-stock-message")
        stock = "Producto sin stock" if no_stock.count() > 0 else "Disponible"

        print(f"📦 [{region} / {commune}] → Stock: {stock}. *Farmacia ahumada solo ofrece visualización de stock online, no según tienda física")

        browser.close()

# 🧪 Entrada estándar
if __name__ == "__main__":
    url = input("🔗 Ingresa la URL del producto: ").strip()
    comuna = input("🏙️ Ingresa la comuna: ").strip()
    get_stock_info(url, comuna)
