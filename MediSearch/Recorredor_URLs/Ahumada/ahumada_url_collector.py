import json
import asyncio
from playwright.async_api import async_playwright

async def get_product_urls(page, subcat_url):
    await page.goto(subcat_url, timeout=0)
    previous_height = 0
    scroll_attempts = 0

    # Scroll hasta que no carguen más productos
    while scroll_attempts < 20:
        await page.mouse.wheel(0, 3000)
        await asyncio.sleep(1)
        new_height = await page.evaluate("document.body.scrollHeight")
        if new_height == previous_height:
            scroll_attempts += 1
        else:
            scroll_attempts = 0
        previous_height = new_height

    # Extraer URLs únicas de productos
    links = await page.eval_on_selector_all("a.ProductCard__Wrapper-sc", "elements => [...new Set(elements.map(e => e.href))]")
    return links

async def collect_all_urls(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for category in data["categories"]:
            for subcat in category["subcategories"]:
                name = subcat["name"]
                url = subcat["url"]
                print(f"🔍 Recolectando: {name} -> {url}")
                try:
                    urls = await get_product_urls(page, url)
                    subcat["urls"] = urls
                except Exception as e:
                    print(f"⚠️ Error en {name}: {e}")
                    subcat["urls"] = []

        await browser.close()

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("✅ Recolección completa.")

# Uso
if __name__ == "__main__":
    asyncio.run(collect_all_urls("categorias_salcobrand.json", "categorias_con_urls.json"))
