from playwright.sync_api import sync_playwright

def fetch_product_with_context(product_id: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        print("Estableciendo sesión en Cruz Verde...")
        page = context.new_page()
        page.goto("https://www.cruzverde.cl", timeout=15000)
        page.wait_for_timeout(2000)

        # Visitar página del producto para detectar "bioequivalente" desde el HTML
        product_page_url = f"https://www.cruzverde.cl/pdp/{product_id}.html"
        page.goto(product_page_url, timeout=20000)
        page.wait_for_timeout(2000)
        html = page.content()

        # Detección rápida sin BeautifulSoup
        bioequivalente = "Sí" if "medicamento tiene un bioequivalente" in html.lower() else "No"

        # Consulta a la API con sesión activa
        api_url = f"https://api.cruzverde.cl/product-service/products/detail/{product_id}"
        print(f"📦 Solicitando datos del producto ID: {product_id}...")

        response = context.request.get(api_url, headers={
            "Accept": "application/json",
            "Origin": "https://www.cruzverde.cl",
            "Referer": "https://www.cruzverde.cl/",
        })

        if response.status != 200:
            print(f"Error al hacer request: {response.status}")
            return None

        data = response.json()
        browser.close()
        return data, bioequivalente

# Ejecutar y mostrar resultado
if __name__ == "__main__":
    product_id = "265395"
    result = fetch_product_with_context(product_id)

    if result:
        data, bioequivalente = result
        product = data["productData"]

        nombre = product.get("name", "N/A")
        imagen = product.get("metaTags", {}).get("ogImage", "N/A")
        url = "https://www.cruzverde.cl/" + product.get("shareURL", "").replace("undefined", "")
        precio_oferta = product.get("prices", {}).get("price-sale-cl", product.get("price", 0))
        precio_normal = product.get("prices", {}).get("price-list-cl", 0)
        descuento = f"{round(100 * (1 - precio_oferta / precio_normal))}%" if precio_normal > precio_oferta else "0%"

        requiere_receta = "Sí" if product.get("prescription") == "simple" else "No"
        retiro = "Sí" if product.get("storePickup") else "No"
        despacho = "Sí" if product.get("homeDelivery") else "No"

        vendor = product.get("laboratory") or product.get("manufacturerName", "N/A")
        descripcion = product.get("pageDescription", "N/A")
        tipo_producto = product.get("category", "N/A").replace("-", " ")
        principio_activo = product.get("activeIngredient", "N/A")
        miligramos = product.get("dose", "N/A")
        comprimidos = product.get("format", "N/A")

        print("\nNombre:", nombre)
        print("Imagen:", imagen)
        print("URL:", url)
        print("Precio Oferta:", f"${precio_oferta}")
        print("Precio Normal:", f"${precio_normal}" if precio_normal else "No aplica")
        print("% Descuento:", descuento)
        print("¿Requiere receta?:", requiere_receta)
        print("Retiro en tienda:", retiro)
        print("Despacho a domicilio:", despacho)
        print("Laboratorio / Vendor:", vendor)
        print("Descripción:", descripcion)
        print("Tipo de producto:", tipo_producto)
        print("Principio Activo:", principio_activo)
        print("Miligramos:", miligramos)
        print("Comprimidos:", comprimidos)
        print("¿Es bioequivalente?:", bioequivalente)
    else:
        print("No se obtuvo data.")
