// Archivo: MediSearch/scraping_tasks/automated_medicines.ts
// Ejecuta automáticamente los scrapers y luego inserta los medicamentos con InsertMedicines
// Requiere permisos: --allow-read --allow-run --allow-env --allow-net --allow-write

import { emptyDirSync, existsSync, walkSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.201.0/path/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

const scrapers = [
  { name: "Ahumada", command: ["python3", "MediSearch\Scrapers_MediSearch\fast_scrapers\ahumada_fast_scraper.py"] },
  { name: "Cruz Verde", command: ["python3", "MediSearch\Scrapers_MediSearch\fast_scrapers\cruzverde_fast_scraper.py"] },
  { name: "Salcobrand", command: ["python3", "MediSearch\Scrapers_MediSearch\fast_scrapers\salcobrand_fast_scraper.py"] },
];

const totalStart = Date.now();
const elapsedTimes: number[] = [];
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, "-");
const logFile = `logs/scrape_${timestamp}.log`;

async function log(message: string) {
  console.log(message);
  await Deno.writeTextFile(logFile, message + "\n", { append: true });
}

try {
  await Deno.mkdir("logs", { recursive: true });
} catch (_) {}

function renderProgressBar(completed: number, total: number): string {
  const width = 30;
  const percent = completed / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const percentage = Math.round(percent * 100);
  return `[${bar}] ${percentage}%`;
}

let errors: string[] = [];

async function runScraper({ name, command }: { name: string; command: string[] }, index: number, total: number) {
  await log(`\n🔄 [${index + 1}/${total}] Ejecutando scraper de ${name}...`);
  const start = Date.now();

  const process = Deno.run({ cmd: command, stdout: "piped", stderr: "piped" });
  const { success } = await process.status();

  const duration = (Date.now() - start) / 1000;
  elapsedTimes.push(duration);

  if (success) {
    await log(`✅ Scraper de ${name} completado en ${duration.toFixed(1)} segundos.`);
  } else {
    const error = new TextDecoder().decode(await process.stderrOutput());
    await log(`❌ Error en scraper de ${name}:\n${error}`);
    errors.push(`Scraper ${name} falló: ${error}`);
  }

  process.close();

  const remaining = total - (index + 1);
  if (remaining > 0) {
    const avgTime = elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length;
    const estRemaining = avgTime * remaining;
    await log(`⏳ Estimado restante: ${estRemaining.toFixed(1)} seg (${remaining} scraper(s) restantes)`);
  }

  await log(renderProgressBar(index + 1, total));
}

// 🔁 Ejecutar scrapers
for (let i = 0; i < scrapers.length; i++) {
  await runScraper(scrapers[i], i, scrapers.length);
}

// ✅ Insertar medicamentos en MongoDB
await log("\n🟢 Ejecutando InsertMedicines...");
const insertProcess = Deno.run({
  cmd: [
    "deno",
    "run",
    "--allow-read",
    "--allow-env",
    "--allow-net",
    "scraping_tasks/insertMedicines.ts", // ✅ RUTA ACTUALIZADA
  ],
  stdout: "piped",
  stderr: "piped",
});
const insertStatus = await insertProcess.status();

if (insertStatus.success) {
  await log("✅ InsertMedicines ejecutado correctamente.");
} else {
  const err = new TextDecoder().decode(await insertProcess.stderrOutput());
  await log("❌ Error ejecutando InsertMedicines:\n" + err);
  errors.push("InsertMedicines falló: " + err);
}
insertProcess.close();

// 🧹 Limpieza de carpetas temporales
await log("\n🧹 Limpiando carpetas temporales...");
const updatesPath = "MediSearch\Scrapers_MediSearch\product_updates";
if (existsSync(updatesPath)) {
  for (const entry of walkSync(updatesPath, { maxDepth: 1, includeDirs: true })) {
    if (entry.isDirectory && entry.path !== updatesPath) {
      try {
        emptyDirSync(entry.path);
        Deno.removeSync(entry.path, { recursive: true });
        await log(`🗑️ Eliminada carpeta: ${entry.path}`);
      } catch (err) {
        await log(`⚠️ No se pudo eliminar ${entry.path}: ${err}`);
        errors.push("No se pudo eliminar carpeta: " + entry.path);
      }
    }
  }
}

const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
await log(`\n🎉 Scrapeo e inserción completado en ${totalElapsed} segundos. Carpetas temporales eliminadas.`);

// 📧 Enviar correo de notificación
async function sendEmailNotification(duration: string, errors: string[]) {
  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: Deno.env.get("GMAIL_USER")!,
      password: Deno.env.get("GMAIL_PASS")!,
    });

    const content = errors.length === 0
      ? `Todos los scrapers se ejecutaron con éxito.\nInsertMedicines funcionó correctamente.\nTiempo total: ${duration} segundos.`
      : `Se produjeron errores durante la ejecución:\n\n${errors.join("\n")}`;

    const subject = errors.length === 0
      ? "✅ Scrapeo completado correctamente"
      : "❌ Fallos en el proceso de scrapeo";

    await client.send({
      from: Deno.env.get("GMAIL_USER")!,
      to: "pharmasearch.alerts@gmail.com", 
      subject,
      content,
    });

    await log("📬 Correo de notificación enviado.");
  } catch (err) {
    await log("⚠️ Error al enviar correo de notificación:\n" + err);
  } finally {
    await client.close();
  }
}

await sendEmailNotification(totalElapsed, errors);
