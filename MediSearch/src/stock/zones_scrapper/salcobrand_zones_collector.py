import requests
import json
import os

# 📂 Crear carpeta si no existe
output_dir = "../zones"
os.makedirs(output_dir, exist_ok=True)

# 🌐 Consultar API de Salcobrand
url = "https://salcobrand.cl/api/v2/selects/communes"
response = requests.get(url)
data = response.json()

# 🧹 Limpiar y extraer comuna, región y zoneId
final = []
for item in data:
    if not item.get("zones_ids"):
        continue  # Saltar comunas sin zoneId

    region = item["label"].split(", Región ", 1)[-1].strip()
    final.append({
        "region": region,
        "commune": item["commune"],
        "zoneId": item["zones_ids"][0]
    })

# 💾 Guardar archivo final
output_path = os.path.join(output_dir, "salcobrand_stock_locations.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final, f, indent=2, ensure_ascii=False)

print(f"✅ Archivo guardado en {output_path} con {len(final)} comunas.")
