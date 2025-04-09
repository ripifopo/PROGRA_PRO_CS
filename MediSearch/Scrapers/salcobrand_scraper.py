import json
import re
import unicodedata
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

def remove_accents(text):
    if text is None:
        return None
    return unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8")

def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def detect_match(text, data_list):
    if not text:
        return None
    text_lower = text.lower()
    for entry in data_list:
        if entry["name"] in text_lower:
            return entry["name"]
        for synonym in entry.get("synonyms", []):
            if synonym in text_lower:
                return entry["name"]
    return None

def fetch_salcobrand_data(url: str):
    labs = load_json("labs.json")
    formats = load_json("formats.json")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=20000)
        page.wait_for_selector("h1", timeout=10000)
        html = page.content()
        browser.close()

    soup = BeautifulSoup(html, "html.parser")

    # Name
    name_tag = soup.select_one("h1.product-name")
    name = name_tag.get_text(strip=True) if name_tag else None

    # Description
    description_tag = soup.find("meta", attrs={"name": "description"})
    description = description_tag["content"] if description_tag else None

    # Extract data from RetailRocket API
    product_id_match = re.search(r'default_sku=(\d+)', url)
    product_id = product_id_match.group(1) if product_id_match else None

    api_url = f"https://api.retailrocket.net/api/1.0/partner/602bba6097a5281b4cc438c9/items/?itemsIds={product_id}&stock=&format=json"
    import requests
    response = requests.get(api_url)
    data = response.json()[0] if response.ok else {}

    # Prices and stock
    offer_price = int(data.get("Price", 0)) or None
    normal_price = int(data.get("OldPrice", 0)) or None
    discount = round(100 * (1 - offer_price / normal_price)) if normal_price and offer_price and normal_price > offer_price else 0
    stock = "Yes" if data.get("IsAvailable") else "No"
    prescription_required = "No" if data.get("Params", {}).get("saleType") == "not_drug" else "Yes"

    # Units and pharmaceutical form from Size
    size = data.get("Size", "")
    match_units = re.search(r'(\d+)', size)
    units = match_units.group(1) if match_units else None

    pharmaceutical_form = detect_match(size, formats)
    pharmaceutical_form = pharmaceutical_form.capitalize() if pharmaceutical_form else None

    # Brand from name (before (B) or (R))
    brand_match = re.match(r"^(.*?)\s+\([BR]\)", name or "", re.IGNORECASE)
    brand = brand_match.group(1).strip() if brand_match else None
    brand = remove_accents(brand)

    # Vendor (laboratory)
    vendor_raw = remove_accents(data.get("Vendor", ""))
    vendor = detect_match(vendor_raw, labs)
    laboratory = vendor.capitalize() if vendor else vendor_raw

    # Active ingredient
    ai_match = re.search(r"\)\s*([^0-9]+)\s*\d+\s?(mg|g)", name or "", re.IGNORECASE)
    active_ingredient = remove_accents(ai_match.group(1).strip()) if ai_match else None

    # Milligrams
    mg_match = re.search(r'(\d+)\s?(mg|g)', name.lower()) if name else None
    milligrams = mg_match.group(1) if mg_match else None

    # Image
    image = data.get("PictureUrl")

    print(f"""
Name: {remove_accents(name)}
Image: {image}
URL: {url}
Offer Price: {offer_price}
Normal Price: {normal_price}
Discount: {discount}
Prescription Required: {prescription_required}
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
    url = "https://salcobrand.cl/products/tradox-b-lamotrigina-50mg-30-comprimidos?default_sku=30488&queryID=afb906e80d37c6c8674daef85bb9b98f"
    fetch_salcobrand_data(url)
