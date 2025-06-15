import requests
import json

url = "https://api.cruzverde.cl/product-service/zones"
response = requests.get(url)
data = response.json()

final = []

for region in data["zones"]:
    comunas = data["values"].get(region, [])
    for c in comunas:
        final.append({
            "region": region,
            "commune": c["name"],
            "zoneId": c["zoneId"]
        })

# Guardar en carpeta ../zones
with open("../zones/cruzverde_stock_locations.json", "w", encoding="utf-8") as f:
    json.dump(final, f, indent=2, ensure_ascii=False)

print("✅ Archivo cruzverde_locations.json guardado en ../zones")
