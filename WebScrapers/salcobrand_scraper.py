from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import json

def fetch_salcobrand_data(url: str):
    # Renderizar con Playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=20000)
        page.wait_for_selector("h1", timeout=10000)
        html = page.content()
        browser.close()

    # Parsear HTML
    soup = BeautifulSoup(html, "html.parser")

    # Nombre
    nombre = soup.select_one("h1.product-name")
    nombre = nombre.get_text(strip=True) if nombre else "N/A"

    # Descripción
    descripcion_tag = soup.find("meta", attrs={"name": "description"})
    descripcion = descripcion_tag["content"] if descripcion_tag else "N/A"

    bioequivalente = "Sí" if soup.find(string=lambda t: t and "bioequivalente" in t.lower()) else "No"

    # Extraer JSON embebido con precios, vendor, etc.
    json_script = next((s for s in soup.find_all("script") if "product_traker_data" in s.text), None)
    product_data = {}
    if json_script:
        match = re.search(r'var product_traker_data\s*=\s*({.*});', json_script.text, re.DOTALL)
        if match:
            try:
                json_raw = match.group(1)
                json_raw = re.sub(r'//.*?\n', '', json_raw)
                product_data = json.loads(json_raw)
            except Exception:
                pass

    # Precios
    price = int(float(product_data.get("price", 0)))
    old_price = int(float(product_data.get("oldPrice", 0)))
    precio_oferta = f"${price}" if price else "N/A"
    precio_normal = f"${old_price}" if old_price > price else "N/A"
    descuento = f"{round((1 - price/old_price)*100)}%" if old_price > price > 0 else "0%"

    # Imagen
    imagen_url = product_data.get("pictureUrl", "N/A")

    # Vendor
    vendor = product_data.get("vendor", "N/A")

    # Flags
    params = product_data.get("products", {}).get(str(product_data.get("productIDs", ["0"])[0]), {}).get("params", {})
    requiere_receta = "No" if product_data.get("params", {}).get("saleType") == "not_drug" else "Sí"
    retiro = "Sí" if params.get("pickupDelivery") else "No"
    despacho = "Sí" if params.get("packageDelivery") else "No"

    # Principio activo, forma farmacéutica, miligramos
    principio_activo = tipo_producto = miligramos = "N/A"
    info_extra = soup.find("p", class_="mb-0")
    if info_extra:
        texto = info_extra.get_text()
        match_principio = re.search(r'Principio Activo:\s*([^/]+)', texto)
        match_forma = re.search(r'Forma Farmac[eé]utica:\s*([^/]+)', texto)
        match_mg = re.search(r'Dosis.*?:\s*(\d+\s?mg)', texto, re.IGNORECASE)
        if match_principio:
            principio_activo = match_principio.group(1).strip()
        if match_forma:
            tipo_producto = match_forma.group(1).strip()
        if match_mg:
            miligramos = match_mg.group(1).strip()

    # Comprimidos (desde nombre)
    match_comprimidos = re.search(r'(\d+)\s?Comprimidos', nombre, re.IGNORECASE)
    comprimidos = match_comprimidos.group(1) if match_comprimidos else "N/A"

    # Resultado
    print(f"""Nombre: {nombre}
Imagen: {imagen_url}
URL: {url}
Precio Oferta: {precio_oferta}
Precio Normal: {precio_normal}
% Descuento: {descuento}
¿Requiere receta?: {requiere_receta}
Retiro en tienda: {retiro}
Despacho a domicilio: {despacho}
Laboratorio / Vendor: {vendor}
Descripción: {descripcion}
Tipo de producto: {tipo_producto}
Principio Activo: {principio_activo}
Miligramos por dosis: {miligramos}
Comprimidos: {comprimidos}
Bioequivalente: {bioequivalente}
""")

# Ejemplo de uso
if __name__ == "__main__":
    url = "https://salcobrand.cl/products/abrilar-hedera-helix-35mg-5ml-jarabe-100ml?default_sku=2570513&queryID=d37d1aaaa044aa156036fae76b31baa6"
    fetch_salcobrand_data(url)
