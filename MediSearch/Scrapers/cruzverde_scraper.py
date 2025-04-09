import json
import re
import unicodedata
from playwright.sync_api import sync_playwright

def remove_accents(text):
    if text is None:
        return None
    return unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')

def normalize(text):
    return remove_accents(text).lower().strip() if text else ""

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def detect_match(text, data_list):
    text = normalize(text)
    for entry in data_list:
        if normalize(entry["name"]) in text:
            return entry["name"]
        for synonym in entry.get("synonyms", []):
            if normalize(synonym) in text:
                return entry["name"]
    return None

def fetch_cruzverde_data(url: str):
    match = re.search(r'/(\d+)\.html', url)
    if not match:
        print("Invalid URL: Product ID not found.")
        return

    product_id = match.group(1)

    forms = load_json("formats.json")
    labs = load_json("labs.json")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto("https://www.cruzverde.cl", timeout=15000)
        page.wait_for_timeout(2000)

        page.goto(f"https://www.cruzverde.cl/pdp/{product_id}.html", timeout=20000)
        page.wait_for_timeout(2000)
        html = page.content()

        api_url = f"https://api.cruzverde.cl/product-service/products/detail/{product_id}"
        response = context.request.get(api_url, headers={
            "Accept": "application/json",
            "Origin": "https://www.cruzverde.cl",
            "Referer": "https://www.cruzverde.cl/",
        })

        if response.status != 200:
            print(f"Request failed with status {response.status}")
            return

        data = response.json()
        browser.close()

        product = data["productData"]
        name = remove_accents(product.get("name", None))
        image = product.get("metaTags", {}).get("ogImage", None)
        final_url = "https://www.cruzverde.cl/" + product.get("shareURL", "").replace("undefined", "")

        offer_price = int(product.get("prices", {}).get("price-sale-cl", product.get("price", 0)))
        normal_price = int(product.get("prices", {}).get("price-list-cl", 0))
        discount = round(100 * (1 - offer_price / normal_price)) if normal_price > offer_price else 0

        prescription_required = "Yes" if product.get("prescription") == "simple" else "No"
        stock = "Yes" if "disponible" in html.lower() else "No"

        match_units = re.search(r'\d+', product.get("format", ""))
        units = match_units.group() if match_units else None

        # Active Ingredient
        active_ingredient_raw = product.get("activeIngredient")
        if isinstance(active_ingredient_raw, str):
            if "sin p. activo" in active_ingredient_raw.lower():
                active_ingredient = "No posee"
            elif active_ingredient_raw.strip():
                parts = [x.strip() for x in active_ingredient_raw.split("-")]
                active_ingredient = remove_accents(", ".join(parts))
            else:
                active_ingredient = None
        else:
            active_ingredient = None

        # Milligrams: buscar en el nombre antes de mg/g, fallback a "dose"
        mg_match = re.search(r'(\d+)\s?(mg|g)', name.lower()) if name else None
        if mg_match:
            milligrams = mg_match.group(1)
        else:
            dose_raw = product.get("dose")
            milligrams = ", ".join(re.findall(r'\d+', str(dose_raw))) if dose_raw else None

        # Vendor/Laboratory
        vendor = remove_accents(product.get("laboratory") or product.get("manufacturerName", None))
        vendor_match = detect_match(vendor, labs)
        laboratory = vendor_match.capitalize() if vendor_match else vendor

        # Brand is same as vendor in Cruz Verde
        brand = laboratory

        # Pharmaceutical form
        combined_text = f"{name} {product.get('pageDescription', '')}"
        form_match = detect_match(combined_text, forms)
        pharmaceutical_form = form_match.capitalize() if form_match else product.get("format", None)

        # Description (mantiene acentos)
        description = product.get("pageDescription", None)

        print(f"""
Name: {name}
Image: {image}
URL: {final_url}
Offer_Price: {offer_price}
Normal_Price: {normal_price}
Discount: {discount}
Prescription_Required: {prescription_required}
Stock: {stock}
Units: {units}
Laboratory: {laboratory}
Brand: {brand}
Active Ingredient: {active_ingredient}
Milligrams: {milligrams}
Pharmaceutical Form: {pharmaceutical_form}
Description: {description}
""")

# Ejecutar directamente
if __name__ == "__main__":
    url = "https://www.cruzverde.cl/paracetamol-125-mg-6-supositorios/199334.html"
    fetch_cruzverde_data(url)
