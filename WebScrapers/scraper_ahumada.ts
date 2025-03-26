// scraper.ts
// Ejecutar con: deno run --allow-net scraper.ts <URL>

// Falta instalar correctamente Deno en el repositorio, pero los códigos funcionan

// Importamos el Parser
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts";

// Consultamos la URL del producto (en este caso solo la recivimos escrita)
const url = Deno.args[0] ?? "https://www.farmaciasahumada.cl/locion-hidratante-473-ml-85379.html";

// Simulamos ser un PC para evitar errores
const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
  },
});

// Extraemos el HTML y lo parseamos con lo importado de arriba
const html = await res.text();
const doc = new DOMParser().parseFromString(html, "text/html");
if (!doc) throw new Error("Failed to parse HTML");

const getText = (selector: string): string =>
  doc.querySelector(selector)?.textContent?.trim() ?? "Not found";

// Extraemos el nombre del producto
const name = getText("h1");

// Sacamos la imágen del producto
const image = doc.querySelector("img.d-block.img-fluid.js-swiper-slide")?.getAttribute("src") ?? "Image not found";

// Extraemos los precios (tanto el normal como en oferta)
const mainPriceSpan = doc.querySelector("span.value.d-flex.align-items-center[content]");
const crossedPriceSpan = doc.querySelector("del span.value[content]");

const sale = mainPriceSpan?.getAttribute("content") ?? null;
const normal = crossedPriceSpan?.getAttribute("content") ?? null;

// Definimos retornos "default" por si faltan los precios
let finalPrice = "Price not found";
let normalPriceDisplay = "Normal price not found";
let discountInfo = "No price available";

//
if (sale && normal) {
  const saleInt = parseInt(sale);
  const normalInt = parseInt(normal);
  const diff = Math.round((1 - saleInt / normalInt) * 100);

  if (normalInt > saleInt && diff >= 3) {
    finalPrice = `$${saleInt.toLocaleString("es-CL")}`;
    normalPriceDisplay = `$${normalInt.toLocaleString("es-CL")}`;
    discountInfo = `Sale price: ${finalPrice} (Normal price: ${normalPriceDisplay}, Discount: ${diff}%)`;
  } else {
    finalPrice = `$${Math.min(saleInt, normalInt).toLocaleString("es-CL")}`;
    normalPriceDisplay = finalPrice;
    discountInfo = "No sale available";
  }
} else if (sale) {
  const saleInt = parseInt(sale);
  finalPrice = `$${saleInt.toLocaleString("es-CL")}`;
  normalPriceDisplay = finalPrice;
  discountInfo = "No sale available";
} else {
  finalPrice = "Price not found";
  normalPriceDisplay = "Normal price not found";
  discountInfo = "No price available";
}

// Extraemos la decripción
const description = getText("#product-description-content");

// Vemos si necesita receta
const prescription = doc.querySelector("svg#ico_doc")?.nextElementSibling?.textContent?.trim() ?? "No prescription info";

// Vemos el tema del pickup y delivery
const pickup = doc.querySelector("svg#ico_card_safe")?.nextElementSibling?.textContent?.trim() ?? "No pickup info";
const delivery = doc.querySelector("svg#ico_delivery")?.nextElementSibling?.textContent?.trim() ?? "No delivery info";

// Extraemos los productos alternativos/sugeridos (con sus respectivos datos de precio, oferta, desc, etc)
const tiles = Array.from(doc.querySelectorAll("div.product-tile")).slice(0, 5);
const alternatives = tiles.map((tile) => {
  const title = tile.querySelector("a.link")?.textContent?.trim() ?? "Name not found";
  const url = "https://www.farmaciasahumada.cl" + (tile.querySelector("a.link")?.getAttribute("href") ?? "");
  const img = tile.querySelector("img")?.getAttribute("src") ?? "Image not found";

  const altSaleSpan = tile.querySelector("span.value.d-flex.align-items-center[content]");
  const altNormalSpan = tile.querySelector("del span.value[content]");

  let altInfo = "No sale available";
  let altPrice = "Price not found";

  if (altSaleSpan) {
    const altSale = parseInt(altSaleSpan.getAttribute("content") ?? "0");
    altPrice = `$${altSale.toLocaleString("es-CL")}`;

    if (altNormalSpan) {
      const altNormal = parseInt(altNormalSpan.getAttribute("content") ?? "0");
      const altDiff = Math.round((1 - altSale / altNormal) * 100);
      if (altNormal > altSale && altDiff >= 3) {
        altInfo = `Sale price: $${altSale.toLocaleString("es-CL")} (Normal: $${altNormal.toLocaleString("es-CL")}, Discount: ${altDiff}%)`;
      }
    }
  }

  return { title, url, img, altPrice, altInfo };
});

// Printeamos los datos obtenidos
console.log("\n✅ Product name:", name);
console.log("🖼️ Image:", image);
console.log("💲 Final Price:", finalPrice);
console.log("💲 Normal Price:", normalPriceDisplay);
console.log("📉 Discount Info:", discountInfo);
console.log("📃 Description:", description);
console.log("📑 Prescription:", prescription);
console.log("🏪 Pickup:", pickup);
console.log("🚚 Delivery:", delivery);
console.log("\n🛒 Alternatives:");
if (alternatives.length) {
  alternatives.forEach((a, i) => {
    console.log(` ${i + 1}. ${a.title}`);
    console.log(`    🔗 ${a.url}`);
    console.log(`    🖼️ ${a.img}`);
    console.log(`    💲 ${a.altPrice}`);
    console.log(`    📉 ${a.altInfo}\n`);
  });
} else {
  console.log(" No alternatives found.");
}