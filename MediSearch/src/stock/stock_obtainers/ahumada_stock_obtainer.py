import json
from pathlib import Path
from playwright.sync_api import sync_playwright

# Ruta al archivo de zonas
ZONES_PATH = Path(__file__).parent.parent / "zones" / "ahumada_stock_locations.json"

# Buscar región e inventory_zone según comuna
def get_region_and_zone_by_commune(commune: str):
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        zones = json.load(f)
    for entry in zones:
        if entry["commune"].strip().lower() == commune.strip().lower():
            return entry["region"], entry["inventory_zone"]
    return None, None

# Función principal
def obtener_stock(product_url: str, comuna: str) -> str:
    region, inventory_zone = get_region_and_zone_by_commune(comuna)
    if not region or not inventory_zone:
        return f"No se encontró la zona correspondiente a la comuna '{comuna}'."

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Establecer sesión base
            page.goto("https://www.farmaciasahumada.cl", wait_until="domcontentloaded")

            # Configurar la zona seleccionada
            page.evaluate(f"""
                fetch("/on/demandware.store/Sites-ahumada-cl-Site/default/Stores-SaveZone", {{
                    method: "POST",
                    headers: {{
                        "Content-Type": "application/x-www-form-urlencoded"
                    }},
                    body: "state={region}&city={comuna}"
                }});
            """)
            page.wait_for_timeout(1500)

            # Visitar la página del producto
            page.goto(product_url, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)

            # Verificar presencia del mensaje de sin stock
            no_stock = page.locator(".no-stock-message")
            tiene_stock = no_stock.count() == 0

            estado = "Disponible" if tiene_stock else "Producto sin stock"
            return f"Stock: {estado} | Región: {region} | Comuna: {comuna} (Ahumada - solo stock online)"

        except Exception as e:
            return f"Error al verificar stock: {e}"

        finally:
            browser.close()

# Ejecución directa desde consola
if __name__ == "__main__":
    url = input("URL del producto: ").strip()
    comuna = input("Comuna: ").strip()
    print(obtener_stock(url, comuna))
