from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import json
import unicodedata
from pathlib import Path

def remove_accents(text):
    if text is None:
        return None
    return unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')


def load_json(filename):
    base_path = Path(__file__).resolve().parent
    full_path = base_path / filename
    with open(full_path, "r", encoding="utf-8") as f:
        return json.load(f)


def detect_partial_match(text, data_list):
    if not text:
        return None
    text_lower = text.lower()
    for entry in data_list:
        all_terms = [entry["name"]] + entry.get("synonyms", [])
        for term in all_terms:
            if term.lower() in text_lower:
                return entry["name"]
    return None

def smart_extract_units(name: str) -> int | None:
    if not name:
        return None

    # Primero busca "x <numero>"
    match = re.search(r"x\s*(\d+)", name.lower())
    if match:
        return int(match.group(1))

    # Fallback: primer número entero que aparezca
    fallback_match = re.search(r"\b(\d{1,4})\b", name)
    if fallback_match:
        return int(fallback_match.group(1))

    return None

def fetch_ahumada_data(url: str, test_mode: bool = False):
    labs = load_json("labs.json")
    formats = load_json("formats.json")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=20000)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(1000)
            html = page.content()
            browser.close()

            if not html:
                print("Failed to load the page content.")
                return

            soup = BeautifulSoup(html, "html.parser")

            name_tag = soup.select_one("h1.product-name")
            name = remove_accents(name_tag.get_text(strip=True)) if name_tag else None

            image_tag = soup.find("meta", property="og:image")
            image_url = image_tag["content"] if image_tag else None

            url_tag = soup.find("meta", property="og:url")
            final_url = url_tag["content"] if url_tag else url

            description_tag = soup.select_one("#product-details")
            description = description_tag.get_text(separator=" ", strip=True) if description_tag else None

            offer_price = None
            json_ld_tag = soup.find("script", type="application/ld+json")
            if json_ld_tag:
                try:
                    json_data = json.loads(json_ld_tag.string)
                    if isinstance(json_data, dict) and "offers" in json_data:
                        offer_price = int(float(json_data['offers']['price']))
                except:
                    pass

            normal_price = None
            normal_price_tag = soup.select_one("del span.value")
            if normal_price_tag and normal_price_tag.has_attr("content"):
                try:
                    normal_price = int(float(normal_price_tag['content']))
                except:
                    pass

            try:
                discount = round((1 - offer_price / normal_price) * 100) if normal_price and offer_price and normal_price > offer_price else 0
            except:
                discount = None

            prescription_required = "Yes" if "receta" in html.lower() else "No"
            in_stock = "Yes" if "disponible" in html.lower() else "No"

            units = smart_extract_units(name)

            spec_table = {}
            table = soup.select_one("#product-attribute-specs-table")
            if table:
                for row in table.find_all("tr"):
                    th = row.find("th")
                    td = row.find("td")
                    if th and td:
                        key = th.get_text(strip=True)
                        value = td.get_text(strip=True)
                        spec_table[key] = value

            # Principio activo
            raw_active_ingredient = spec_table.get("Principio Activo")
            active_ingredient = ", ".join([x.strip() for x in raw_active_ingredient.split("-")]) if raw_active_ingredient else None
            active_ingredient = remove_accents(active_ingredient)

            # Laboratorio y marca
            lab_raw = remove_accents(spec_table.get("Laboratorio")) if spec_table.get("Laboratorio") else None
            lab_final = detect_partial_match(lab_raw, labs) or lab_raw
            lab_final = lab_final.capitalize() if lab_final else None

            brand_raw = remove_accents(spec_table.get("Marca")) if spec_table.get("Marca") else lab_raw
            brand = brand_raw

            # Forma farmacéutica
            raw_form = remove_accents(spec_table.get("Forma Farmaceutica")) if spec_table.get("Forma Farmaceutica") else None
            pharmaceutical_form = detect_partial_match(raw_form, formats) or raw_form
            pharmaceutical_form = pharmaceutical_form.capitalize() if pharmaceutical_form else None

            # Concentración → amount y unit
            raw_concentration = spec_table.get("Concentracion")
            amount = None
            unit = None

            if raw_concentration:
                raw_concentration = remove_accents(raw_concentration.lower()).replace(",", ".")

                # mcg → mg
                match = re.search(r"(\d+(?:\.\d+)?)\s*mcg", raw_concentration)
                if match:
                    value = float(match.group(1))
                    amount = str(round(value / 1000, 3)).rstrip("0").rstrip(".")
                    unit = "mg"

                # g → mg
                elif re.search(r"(\d+(?:\.\d+)?)\s*g", raw_concentration):
                    match = re.search(r"(\d+(?:\.\d+)?)\s*g", raw_concentration)
                    if match:
                        value = float(match.group(1))
                        amount = str(round(value * 1000, 3)).rstrip("0").rstrip(".")
                        unit = "mg"

                # mg → mg
                elif re.search(r"(\d+(?:\.\d+)?)\s*mg", raw_concentration):
                    match = re.search(r"(\d+(?:\.\d+)?)\s*mg", raw_concentration)
                    if match:
                        amount = match.group(1)
                        unit = "mg"

                # UI → sin conversión
                elif re.search(r"(\d+(?:\.\d+)?)\s*(ui|u.i\.)", raw_concentration):
                    match = re.search(r"(\d+(?:\.\d+)?)\s*(ui|u.i\.)", raw_concentration)
                    if match:
                        amount = match.group(1)
                        unit = "ui"

            if test_mode:

                print(f"""
                    Name: {name}
                    Image: {image_url}
                    URL: {final_url}
                    Offer Price: {offer_price}
                    Normal Price: {normal_price}
                    Discount: {discount}
                    Prescription Required: {prescription_required}
                    Stock: {in_stock}
                    Units: {units}
                    Laboratory: {lab_final}
                    Brand: {brand}
                    Active Ingredient: {active_ingredient}
                    Amount: {amount}
                    Unit: {unit}
                    Pharmaceutical Form: {pharmaceutical_form}
                    Description: {description}
                    """)
            else:
                return {
                    "name": name,
                    "image": image_url,
                    "final_url": final_url,
                    "offer_price": offer_price,
                    "normal_price": normal_price,
                    "discount": discount,
                    "prescription_required": prescription_required,
                    "in_stock": in_stock,
                    "units": units,
                    "laboratory": lab_final,
                    "brand": brand,
                    "active_ingredient": active_ingredient,
                    "milligrams": amount,
                    "pharmaceutical_form": pharmaceutical_form,
                    "description": description
                }

        except Exception as e:
            print(f"Error during scraping: {e}")

# Ejecutar directamente
if __name__ == "__main__":
    url = "https://www.farmaciasahumada.cl/deltius-50000-ui-solucion-oral-x-4-ampollas-bebibles-90716.html"
    test_mode = True
    fetch_ahumada_data(url)
