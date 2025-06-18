import json
import httpx
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT_PATH = Path("../scraped_location_jsons/scraped_location_cruzverde.json")
API_URL_TEMPLATE = "https://api.cruzverde.cl/product-service/products/stores-in-range?latitude={}&longitude={}&radius={}"

COORDS_LIST = [
    {"lat": -38.7372, "lng": -72.5930, "rad": 49},  # Sur 1
    {"lat": -41.1650, "lng": -73.0000, "rad": 25},  # Sur 2
    {"lat": -18.4783, "lng": -70.3126, "rad": 600},  # Arica 1
    {"lat": -21.4389, "lng": -68.9394, "rad": 600},  # Calama 2
    {"lat": -23.6524, "lng": -70.3954, "rad": 600},  # Antofagasta 3
    {"lat": -27.3668, "lng": -70.3322, "rad": 600},  # Copiapó 4
    {"lat": -29.9078, "lng": -71.2540, "rad": 600},  # La Serena 5
    {"lat": -33.4489, "lng": -70.6693, "rad": 625},  # Santiago 7
    {"lat": -39.8196, "lng": -73.2452, "rad": 120},  # Valdivia 8 -
    {"lat": -45.5752, "lng": -72.0662, "rad": 462.4},  # Coyhaique 9
    {"lat": -53.1638, "lng": -70.9171, "rad": 600},  # Punta Arenas 10
]

def get_cruzverde_cookie():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.cruzverde.cl/", wait_until="networkidle")
        cookies = context.cookies()
        browser.close()
        return "; ".join([f"{c['name']}={c['value']}" for c in cookies])

def main():
    cookie = get_cruzverde_cookie()
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Cookie": cookie
    }

    seen = set()
    sucursales = []

    for idx, coord in enumerate(COORDS_LIST, 1):
        lat, lng = coord["lat"], coord["lng"]
        rad = coord.get("rad", 600)
        print(f"📡 Consultando punto {idx}/{len(COORDS_LIST)}: ({lat}, {lng}) con radio {rad} km...")
        url = API_URL_TEMPLATE.format(lat, lng, rad)

        try:
            r = httpx.get(url, headers=headers, timeout=20)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            print(f"❌ Error al consultar API en punto {idx}: {e}")
            continue

        for store in data:
            try:
                key = (store.get("address"), store.get("commune"))
                if key in seen:
                    continue
                seen.add(key)
                sucursales.append({
                    "address": store.get("address"),
                    "comuna": store.get("commune"),
                    "region": store.get("region"),
                    "lat": float(store["coordinates"]["latitude"]),
                    "lng": float(store["coordinates"]["longitude"]),
                    "horario": store.get("infoStore", {}).get("horary")
                })
            except Exception as e:
                print(f"❌ Error en sucursal: {e}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sucursales, f, indent=2, ensure_ascii=False)

    print(f"💾 Guardado en {OUTPUT_PATH} ({len(sucursales)} sucursales únicas)")

if __name__ == "__main__":
    main()
