### OJO, ESTE SCRAPER FUNCIONA EXCLUSIVAMENTE PARA LA FARMACIA AHUMADA ###

# Importamos requests para hacer peticiones HTTP, y BeautifulSoup para analizar el HTML
import requests
from bs4 import BeautifulSoup

# Establecemos una URL objetivo para scrapear
url = "https://www.farmaciasahumada.cl/locion-hidratante-473-ml-85379.html"

# Usamos headers para simular ser un navegador (y no un bot/script), para evitar problemas
headers = {"User-Agent": "Mozilla/5.0"}

# Descargamos el contenido de la página
response = requests.get(url, headers=headers)

# Recivimos el HTML como texto y lo convertimos a una estructura explorable
soup = BeautifulSoup(response.text, "html.parser")

# Buscamos el nombre del producto (En la Farmacia Ahumada, está en el primer <h1>)
product_name_tag = soup.find("h1")

# Extraemos el nombre (de existir), quitándole los espacios del inicio y del final
product_name = product_name_tag.text.strip() if product_name_tag else "Product name not found"

# Inicializamos una variable con un mensaje por defecto
image_url = "Image not found"

# Buscamos la imagen de la portada del producto, usando su clase
image_tag = soup.select_one("img.d-block.img-fluid.js-swiper-slide")

# Si la etiqueta existe y tiene el atributo src, lo guardamos
if image_tag and image_tag.has_attr("src"):
    image_url = image_tag["src"]

# Inicializamos las variables de precios (por default, sin precio)
sale_price = None
normal_price = None

# Hacemos una variable de texto para guardar la información del descuento (si es que hay)
discount_info = "No sale available"

# Buscamos el contenedor de oferta (solo existe de haber ofertas, o sea, cuando hay un descuento activo)
sale_container = soup.select_one("div.promotion-badge-container")

# De existir el contenedor, buscamos <span> con la clase "value" (Así aparece el descuento en esta farmacia)
if sale_container:
    sale_price_tag = sale_container.find("span", class_="value")

    # Si encontramos el <span>, guardamos el precio que aparece en "content"
    if sale_price_tag and sale_price_tag.has_attr("content"):
        sale_price = int(sale_price_tag["content"])

# Repetimos lo de arriba, pero en otro contenedor, el del precio normal (que siempre existe)
normal_price_tag = soup.select_one("span.value.d-flex.align-items-center[content]")
if normal_price_tag:
    normal_price = int(normal_price_tag["content"])

### Aquí teníamos un problema con algunos productos puntuales.
### Lo que ocurría era que a veces, cuando había solo un precio (el normal), se imprimían 2 (oferta y normal) muy similares
### Descubrimos que el precio menor siempre era el que se mostraba en la página ,
### y que la oferta en sí era casi idéntica (Estaban bug algunos productos)
### Por eso mismo, llegamos a la conclusión de que si habia una diferencia entre oferta y precio normal de menos de un 3%
### Se dejara el precio menor como el normal, con este "algoritmo" nunca más tubimos problemas

# Si existe un precio oferta y un precio normal seguimos haciendo "if"
if sale_price and normal_price:

    # Verificamos que el precio oferta sea menor que el normal (por el bug de mencionado anteriormente)
    if normal_price > sale_price:

        # Calculamos el procentaje de descuento/oferta
        discount_percentage = round((1 - (sale_price / normal_price)) * 100, 2)

        # Si el descuento (porcentual) es mayor (o igual) a 3%, lo consideramos válido
        if discount_percentage >= 3:
            final_price = f"${sale_price:,}".replace(",", ".")
            normal_price_display = f"${normal_price:,}".replace(",", ".")
            discount_info = f"Sale price: {final_price} (Normal price: {normal_price_display}, Discount: {discount_percentage}%)"

        # Si el descuento (porcentual) es menor a 3%, lo consideramos inválido (solucionando el bug mencionado)
        else:
            final_price = f"${sale_price:,}".replace(",", ".")
            normal_price_display = final_price
            discount_info = "No sale available"

    # Si el precio oferta es mayor que el normal (bug/inconsistencia de datos) no mostramos la oferta
    else:
        final_price = f"${sale_price:,}".replace(",", ".")
        normal_price_display = final_price
        discount_info = "No sale available"

# Si solo encontramos un precio oferta (sería raro, pero nos puede servir como debug) avisamos que no hay precio normal
elif sale_price:
    final_price = f"${sale_price:,}".replace(",", ".")
    normal_price_display = "Normal price not found"
    discount_info = f"Sale price: {final_price} (No normal price available)"

# Si encontramos solamente precio normal, decimos que no hay oferta
elif normal_price:
    final_price = f"${normal_price:,}".replace(",", ".")
    normal_price_display = final_price
    discount_info = "No sale available"

# Si no encontramos ningun precio, avisamos (de nuevo, sería raro, pero nos ayuda a debugear)
else:
    final_price = "Price not found"
    normal_price_display = "Normal price not found"
    discount_info = "No price available"

# Extraemos las especificaciónes técnicas de la tabla (de no haber, se soluiona más adelante)
technical_specs = {}
table = soup.find("table", id="product-attribute-specs-table")

# Si la tabla existe, recorremos todas las filas (se encuentran como <fr> en esta farmacia)
if table:
    rows = table.find_all("tr")
    for row in rows:

        # Extraemos el nombre del atributo (ej: laboratorio, principio activo, etc) desde el <th> (table header)
        property_name = row.find("th").text.strip() if row.find("th") else "No label"

        # Extraemos el valor del atributo (ej: Bayer de Chile S.A., Ibuprofeno, etc) desde el <td> (table data)
        value = row.find("td").text.strip() if row.find("td") else "No value"

        # Guardamos la el nombre del atributo y su valor en el diccionario que habíamos creado antes
        technical_specs[property_name] = value

# Si no hay tabla, dejamos el mensaje de error (como tal no es un error, puede no tener tabla, pero lo dejamos así por mientras)
else:
    technical_specs = {"Error": "Technical specifications not found"}


# Extraemos la descripción del producto (si es que existe) de un contenedor <div> con ID específico (de nuevo, propio de la farmacia)
description_tag = soup.find("div", id="product-description-content")
description = description_tag.text.strip() if description_tag else "Description not found"

# Extraemos los datos de receta
prescription_tag = soup.find("svg", id="ico_doc")
prescription_required = prescription_tag.find_next("span").text.strip() if prescription_tag else "No prescription required"

# Extraemos los datos del punto de retiro
pickup_tag = soup.find("svg", id="ico_card_safe")
pickup_available = pickup_tag.find_next("span").text.strip() if pickup_tag else "Not available"

# Extraemos los datos de despacho
delivery_tag = soup.find("svg", id="ico_delivery")
delivery_info = delivery_tag.find_next("span").text.strip() if delivery_tag else "Not available"

# Inicializamos una lista de productos sustitutos/similares, de tamaño máximo 5
alternative_products = []

# Buscamos las "tarjetas" de los productos, que están relacionados con su clase
product_tiles = soup.find_all("div", class_="product-tile")[:5]

# Recorremos cada producto alternativo encontrado
for product in product_tiles:

    # Buscamos el nombre del producto alternativo (de etiqueta <a> con clase 'link')
    alt_name_tag = product.find("a", class_="link")
    alt_name = alt_name_tag.text.strip() if alt_name_tag else "Alternative product name not found"

    # Construimos la URL completa del producto alternativo
    alt_url = "https://www.farmaciasahumada.cl" + alt_name_tag["href"] if alt_name_tag else "URL not found"

    # Extraemos la URL de la imágen referencial del producto
    alt_image_tag = product.find("img", class_="tile-image")
    alt_image_url = alt_image_tag["src"] if alt_image_tag and alt_image_tag.has_attr("src") else "Image not found"

    # Buscamos el precio actual (y de descuento, si es que hay)
    alt_sale_price_tag = product.select_one("span.value.d-flex.align-items-center[content]")
    alt_normal_price_tag = product.select_one("del span.value[content]")

    # Inicializamos las variables por defecto
    alt_final_price = "Price not found"
    alt_normal_price = None
    alt_discount_info = "No sale available"

    # De encontrar algún precio, continuamos
    if alt_sale_price_tag:
        alt_sale_price = int(alt_sale_price_tag["content"])
        alt_final_price = f"${alt_sale_price:,}".replace(",", ".")

        # Si también hay un precio original (en <del>), calculamos el descuento
        if alt_normal_price_tag and alt_normal_price_tag.has_attr("content"):
            alt_normal_price = int(alt_normal_price_tag["content"])

            # Verificamos que el precio normal sea mayor al de oferta
            if alt_normal_price > alt_sale_price:
                discount = round((1 - (alt_sale_price / alt_normal_price)) * 100)

                # Ocupamos el mismo "algoritmo" de antes para solucionar potenciales bugs
                if discount >= 3:
                    alt_discount_info = f"Sale price: {alt_final_price} (Normal price: ${alt_normal_price:,}, Discount: {discount}%)"

                # Ponemos los respectivos "else" en caso de no cumplirse los condicionales de arriba
                else:
                    alt_discount_info = "No sale available"
            else:
                alt_discount_info = "No sale available"
        else:
            alt_discount_info = "No normal price found"
    else:
        alt_discount_info = "No price found"

    # Guardamos toda la información de los productos alternativos en las listas
    alternative_products.append({
        "Name": alt_name,
        "Price": alt_final_price,
        "URL": alt_url,
        "Image_URL": alt_image_url,
        "Discount_Info": alt_discount_info
    })

# Printeamos todos los resultados obtenidos hasta ahora, recorriendo los "diccionarios" necesarios
print(f"Product Name: {product_name}")
print(f"Image URL: {image_url}")
print(f"Final Price: {final_price}")
print(f"Normal Price: {normal_price_display}")
print(f"{discount_info}")

print("\nTechnical Specifications:")
for key, value in technical_specs.items():
    print(f"{key}: {value}")

print("\nDescription:")
print(description)

print("\nAdditional Information:")
print(f"Prescription Required: {prescription_required}")
print(f"Pharmacy Pickup Available: {pickup_available}")
print(f"Delivery Information: {delivery_info}")

print("\nAlternative Products:")
if alternative_products:
    for product in alternative_products:
        print(f"- {product['Name']} ({product['Price']}) → {product['URL']}")
        print(f"  Image: {product['Image_URL']}")
        print(f"  {product['Discount_Info']}")
else:
    print("No alternative products available.")
