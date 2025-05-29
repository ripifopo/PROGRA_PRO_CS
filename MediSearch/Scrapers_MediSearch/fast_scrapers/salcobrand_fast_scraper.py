import json
import time
from datetime import datetime
from pathlib import Path
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed

# Rutas de entrada/salida
INPUT_DIR = Path("../product_jsons_limpios/salcobrand_jsons_limpios")
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
OUTPUT_DIR = Path(f"../product_updates/salcobrand/{timestamp}")
API_URL = "https://salcobrand.cl/api/v2/products/{}"

# 🗂 Procesar un archivo de productos
def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        products = json.load(f)

    if not products:
        return

    categoria = products[0].get("categoria")
    result = []

    for product in products:
        product_id = product.get("id")
        url = product.get("url")
        farmacia = product.get("farmacia")

        try:
            api_url = API_URL.format(product_id)
            r = httpx.get(api_url, timeout=15)
            r.raise_for_status()
            product_data = r.json()

            if not product_data or not isinstance(product_data, dict):
                raise ValueError("Respuesta vacía o inesperada de la API.")

            offer_raw = product_data.get("price") or product_data.get("badge", {}).get("raw_final_price")
            offer_price = int(float(offer_raw)) if offer_raw is not None else None

            old_price_raw = product_data.get("oldPrice")
            normal_price = int(float(old_price_raw)) if old_price_raw and offer_price and old_price_raw > offer_price else None

            discount = round((1 - offer_price / normal_price) * 100) if normal_price else 0

            result.append({
                "id": product_id,
                "farmacia": farmacia,
                "url": url,
                "price_offer": offer_price,
                "price_normal": normal_price,
                "discount": discount
            })

        except Exception as e:
            print(f"⚠️ Error en {product_id}: {e}")

        time.sleep(0.2)

    # Guardar resultados
    output_path = OUTPUT_DIR / f"{categoria}.json"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"✅ Guardado: {output_path}")

# 🚀 Ejecutar en paralelo
def main():
    files = list(INPUT_DIR.glob("*.json"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_file, file): file for file in files}
        for future in as_completed(futures):
            file = futures[future]
            try:
                future.result()
            except Exception as e:
                print(f"❌ Error procesando {file.name}: {e}")

if __name__ == "__main__":
    main()
