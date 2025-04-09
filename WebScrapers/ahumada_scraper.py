from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import json

def fetch_ahumada_data(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print("Cargando página del producto...")
        page.goto(url, timeout=20000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")

    # Nombre
    nombre = soup.select_one("h1.product-name")
    nombre = nombre.get_text(strip=True) if nombre else "N/A"

    # Imagen
    imagen_tag = soup.find("meta", property="og:image")
    imagen_url = imagen_tag["content"] if imagen_tag else "N/A"

    # URL
    url_tag = soup.find("meta", property="og:url")
    url_final = url_tag["content"] if url_tag else url

    # Descripción desde panel "Información"
    descripcion_panel = soup.select_one("#product-details")
    descripcion = descripcion_panel.get_text(separator=" ", strip=True) if descripcion_panel else "N/A"

    # Precio de oferta (JSON-LD)
    precio = "N/A"
    json_ld_tag = soup.find("script", type="application/ld+json")
    if json_ld_tag:
        try:
            json_data = json.loads(json_ld_tag.string)
            if isinstance(json_data, dict) and "offers" in json_data:
                precio = f"${int(float(json_data['offers']['price']))}"
        except Exception:
            pass

    # Precio normal (HTML)
    precio_normal_tag = soup.select_one("del span.value")
    precio_normal = f"${precio_normal_tag['content']}" if precio_normal_tag and precio_normal_tag.has_attr("content") else "N/A"

    # % Descuento
    try:
        p = int(precio.replace("$", "").replace(".", ""))
        p_old = int(precio_normal.replace("$", "").replace(".", ""))
        descuento = f"{round((1 - p / p_old) * 100)}%" if p_old > p else "0%"
    except:
        descuento = "N/A"

    # ¿Requiere receta?
    requiere_receta = "Sí" if "receta" in html.lower() else "No"

    # Comprimidos
    match_comprimidos = re.search(r"(\d+)\s?Comprimidos", nombre, re.IGNORECASE)
    comprimidos = match_comprimidos.group(1) if match_comprimidos else "N/A"

    # Ficha Técnica
    ficha_tecnica = {}
    tabla = soup.select_one("#product-attribute-specs-table")
    if tabla:
        for row in tabla.find_all("tr"):
            th = row.find("th")
            td = row.find("td")
            if th and td:
                key = th.get_text(strip=True)
                value = td.get_text(strip=True)
                ficha_tecnica[key] = value

    principio_activo_raw = ficha_tecnica.get("Principio Activo", "N/A")
    principio_activo = ", ".join(principio_activo_raw.split("-")) if principio_activo_raw != "N/A" else "N/A"

    laboratorio = ficha_tecnica.get("Laboratorio", "N/A")
    marca = ficha_tecnica.get("Marca", "N/A")
    miligramos = ficha_tecnica.get("Concentracion", "N/A")
    forma_farmaceutica = ficha_tecnica.get("Forma Farmaceutica", "N/A")

    # Mostrar resultado
    print(f"""
Nombre: {nombre}
Imagen: {imagen_url}
URL: {url_final}
Precio Oferta: {precio}
Precio Normal: {precio_normal}
% Descuento: {descuento}
¿Requiere receta?: {requiere_receta}
Comprimidos: {comprimidos}
Laboratorio: {laboratorio}
Marca: {marca}
Principio Activo: {principio_activo}
Miligramos: {miligramos}
Forma Farmacéutica: {forma_farmaceutica}
Descripción: {descripcion}
""")

# Ejemplo de uso
if __name__ == "__main__":
    url = "https://www.farmaciasahumada.cl/brevex-x-20-comprimidos-recubiertos-45188.html"
    fetch_ahumada_data(url)
