import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path

# 🌐 URL de producto cualquiera (donde aparece el atributo data-options-list)
url = "https://www.farmaciasahumada.cl/etovitae-90-mg-x-14-comprimidos-recubiertos-94018.html"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

form_tag = soup.find("form", class_="change-region-form")

if form_tag and form_tag.has_attr("data-options-list"):
    try:
        data_str = form_tag["data-options-list"]
        data_json = json.loads(data_str)

        zonas = []
        for region in data_json:
            region_name = region["name"]
            for comuna in region.get("sectorList", []):
                zonas.append({
                    "region": region_name,
                    "commune": comuna["name"],
                    "inventory_zone": comuna["inventoryZone"]
                })

        # 📁 Guardar en ../zones/ahumada_inventory_zones.json
        output_path = Path("../zones/ahumada_stock_locations.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(zonas, f, ensure_ascii=False, indent=2)

        print(f"✅ Archivo guardado: {output_path.resolve()} con {len(zonas)} zonas.")

    except Exception as e:
        print("⚠️ Error al procesar data-options-list:", e)
else:
    print("❌ No se encontró el atributo data-options-list.")
