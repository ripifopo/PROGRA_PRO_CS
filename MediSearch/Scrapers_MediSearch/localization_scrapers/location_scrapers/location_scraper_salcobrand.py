import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT_FILE = Path("../scraped_location_jsons/scraped_location_salcobrand.json")
BASE_URL = "https://salcobrand.cl/content/servicios/mapa?page={}"

def extract_sucursal_info(pill):
    def get_text(selector):
        el = pill.query_selector(selector)
        if el:
            text = el.inner_text().strip()
            return text.split("\n")[-1].strip()
        return None

    address = get_text(".stores__content--is-address")
    comuna = get_text(".stores__content--is-county")
    region = get_text(".stores__content--is-region")

    horario = None
    block = pill.query_selector(".stores__content--is-schedule")
    if block:
        horario = "\n".join(p.inner_text().strip() for p in block.query_selector_all("p"))

    lat = lng = None
    link = pill.query_selector(".stores__content--is-map a")
    if link:
        href = link.get_attribute("href")
        match = re.search(r"/dir/([-.\d]+),([-.\d]+)", href)
        if match:
            lat_raw = match.group(1)
            lng_raw = match.group(2)

            # Eliminar separadores de miles (todos los puntos menos el último)
            lat_str = lat_raw.replace(".", "", lat_raw.count(".") - 1)
            lng_str = lng_raw.replace(".", "", lng_raw.count(".") - 1)

            # Evitar doble negativo
            lat = float(lat_str.lstrip("-")) * (-1 if lat_str.startswith("-") else 1)
            lng = float(lng_str.lstrip("-")) * (-1 if lng_str.startswith("-") else 1)

    return {
        "address": address,
        "comuna": comuna,
        "region": region,
        "horario": horario,
        "latitude": lat,
        "longitude": lng
    }

def main():
    all_sucursales = []
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page_num = 1
        while True:
            url = BASE_URL.format(page_num)
            print(f"🔍 Visitando página {page_num}...")
            page.goto(url, timeout=20000)

            try:
                page.wait_for_selector("li.stores__pill", timeout=6000)
            except:
                print("✅ No se encontraron más sucursales. Fin del scraping.")
                break

            pills = page.query_selector_all("li.stores__pill")
            if not pills:
                print("⚠️ Página vacía.")
                break

            for pill in pills:
                try:
                    sucursal = extract_sucursal_info(pill)
                    all_sucursales.append(sucursal)
                except Exception as e:
                    print(f"❌ Error en sucursal: {e}")

            page_num += 1

        browser.close()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_sucursales, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Guardado en {OUTPUT_FILE} ({len(all_sucursales)} sucursales)")

if __name__ == "__main__":
    main()
