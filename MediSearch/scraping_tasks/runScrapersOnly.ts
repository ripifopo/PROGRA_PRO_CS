// Archivo: scraping_tasks/runScrapersOnly.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { walkSync } from "https://deno.land/std@0.201.0/fs/walk.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

const scrapers = [
  { name: "Ahumada", command: ["python3", "Scrapers_MediSearch/fast_scrapers/ahumada_fast_scraper.py"] },
  { name: "Cruz Verde", command: ["python3", "Scrapers_MediSearch/fast_scrapers/cruzverde_fast_scraper.py"] },
  { name: "Salcobrand", command: ["python3", "Scrapers_MediSearch/fast_scrapers/salcobrand_fast_scraper.py"] },
];

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = `logs/scrape_only_${timestamp}.log`;

await Deno.mkdir("logs", { recursive: true }).catch(() => {});
let errors: string[] = [];

async function log(msg: string) {
  console.log(msg);
  await Deno.writeTextFile(logFile, msg + "\n", { append: true });
}

function hasJsonFiles(path: string): boolean {
  for (const entry of walkSync(path, { includeFiles: true })) {
    if (entry.name.endsWith(".json") || entry.name.endsWith(".jsonl")) return true;
  }
  return false;
}

for (const scraper of scrapers) {
  await log(`🔄 Ejecutando scraper de ${scraper.name}...`);
  const p = Deno.run({ cmd: scraper.command, stdout: "piped", stderr: "piped" });
  const status = await p.status();

  if (status.success) {
    await log(`✅ ${scraper.name} finalizado correctamente.`);
  } else {
    const error = new TextDecoder().decode(await p.stderrOutput());
    await log(`❌ Error en ${scraper.name}:\n${error}`);
    errors.push(`${scraper.name}: ${error}`);
  }

  p.close();
}

const anyData = hasJsonFiles("Scrapers_MediSearch/product_updates");
if (!anyData) {
  await log("⚠️ No se encontraron archivos JSON generados.");
  errors.push("No se generaron archivos JSON.");
}

await log("📬 Enviando correo de notificación...");

const client = new SmtpClient();
try {
  await client.connectTLS({
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("GMAIL_USER")!,
    password: Deno.env.get("GMAIL_PASS")!,
  });

  const subject = errors.length === 0
    ? "✅ Scrapeo listo para inserción manual"
    : "❌ Scrapeo con errores - revisar logs";

  const content = errors.length === 0
    ? `El scrapeo diario se ejecutó correctamente.\nPuedes ejecutar manualmente el insert con:\n\ndeno task insert-medicines\n\n🕓 ${new Date().toLocaleString()}`
    : `El scrapeo encontró errores:\n\n${errors.join("\n")}\n\nRevisar logs.`

  await client.send({
    from: Deno.env.get("GMAIL_USER")!,
    to: "pharmasearch.alerts@gmail.com",
    subject,
    content,
  });

  await log("📨 Correo enviado.");
} catch (e) {
  await log("❌ Error al enviar correo: " + e);
} finally {
  await client.close();
}
