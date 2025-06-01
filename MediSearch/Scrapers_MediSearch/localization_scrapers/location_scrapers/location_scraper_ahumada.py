import requests
import json
from pathlib import Path

URL = "https://www.farmaciasahumada.cl/on/demandware.store/Sites-ahumada-cl-Site/default/Stores-FindStores?showAllStores=true"
OUTPUT_FILE = "../scraped_location_jsons/scraped_location_ahumada.json"

def fetch_ahumada_branches():
    response = requests.get(URL, timeout=30)
    response.raise_for_status()
    data = response.json()

    # Extraer solamente la parte útil
    branches = data.get("stores", [])

    # Formatear salidas
    formatted = []
    for b in branches:
        formatted.append({
            "id": b.get("ID"),
            "name": b.get("name"),
            "address": b.get("address1"),
            "city": b.get("city"),
            "region": b.get("stateCode"),
            "country": b.get("countryCode"),
            "phone": b.get("phone"),
            "latitude": b.get("latitude"),
            "longitude": b.get("longitude"),
            "hours": b.get("storeHours"),
            "is_24hrs": b.get("is24hours"),
            "has_parking": b.get("hasParking")
        })

    # Guardar como JSON
    Path(OUTPUT_FILE).write_text(json.dumps(formatted, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Se guardaron {len(formatted)} sucursales en '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    fetch_ahumada_branches()
