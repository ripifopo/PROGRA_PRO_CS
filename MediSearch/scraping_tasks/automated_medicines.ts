// Archivo: MediSearch/scraping_tasks/automated_medicines.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { emptyDirSync, existsSync, walkSync } from "https://deno.land/std@0.201.0/fs/mod.ts";
import { join, basename } from "https://deno.land/std@0.201.0/path/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

const scrapers = [
  { name: "Ahumada", command: ["python3", "Scrapers_MediSearch/fast_scrapers/ahumada_fast_scraper.py"] },
  { name: "Cruz Verde", command: ["python3", "Scrapers_MediSearch/fast_scrapers/cruzverde_fast_scraper.py"] },
  { name: "Salcobrand", command: ["python3", "Scrapers_MediSearch/fast_scrapers/salcobrand_fast_scraper.py"] },
];

const totalStart = Date.now();
const elapsedTimes: number[] = [];
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = `logs/scrape_${timestamp}.log`;
const updatesPath = "Scrapers_MediSearch/product_updates";
const backupPath = `backups/updates_${timestamp}`;

async function log(message: string) {
  console.log(message);
  await Deno.writeTextFile(logFile, message + "\n", { append: true });
}

await Deno.mkdir("logs", { recursive: true }).catch(() => {});
await Deno.mkdir("backups", { recursive: true }).catch(() => {});
await Deno.mkdir(updatesPath, { recursive: true }).catch(() => {}); // ✅ asegura que la carpeta exista

function renderProgressBar(completed: number, total: number): string {
  const width = 30;
  const percent = completed / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${Math.round(percent * 100)}%`;
}

let errors: string[] = [];

async function runScraper({ name, command }: { name: string; command: string[] }, index: number, total: number) {
  await log(`\n🔀 [${index + 1}/${total}] Ejecutando scraper de ${name}...`);
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
    await log(`⏳ Estimado restante: ${(avgTime * remaining).toFixed(1)} seg (${remaining} scraper(s) restantes)`);
  }

  await log(renderProgressBar(index + 1, total));
}

// 🔁 Ejecutar scrapers
for (let i = 0; i < scrapers.length; i++) {
  await runScraper(scrapers[i], i, scrapers.length);
}

// 🧪 Función: verificar si hay archivos .json en product_updates
function hasJsonFiles(path: string): boolean {
  for (const entry of walkSync(path, { includeFiles: true })) {
    if (entry.name.endsWith(".json")) return true;
  }
  return false;
}

// 💾 Backup antes de eliminar
if (existsSync(updatesPath)) {
  await log(`🗂️ Creando respaldo en ${backupPath}`);
  await Deno.run({ cmd: ["cp", "-r", updatesPath, backupPath] }).status();
}

// ✅ Solo ejecutar InsertMedicines si no hubo errores y hay archivos JSON
if (errors.length === 0 && hasJsonFiles(updatesPath)) {
  await log("\n🟢 Todos los scrapers fueron exitosos y se detectaron archivos JSON. Ejecutando InsertMedicines...");
  const insertProcess = Deno.run({
    cmd: [
      "deno",
      "run",
      "--allow-read",
      "--allow-env",
      "--allow-net",
      "--allow-sys",
      "scraping_tasks/insertMedicines.ts",
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
} else {
  await log("⛔ No se ejecutará InsertMedicines: hubo errores o no se encontraron archivos JSON.");
  if (!hasJsonFiles(updatesPath)) {
    errors.push("No se encontraron archivos .json para insertar.");
  }
  if (errors.length > 0) {
    errors.push("InsertMedicines fue cancelado por precaución.");
  }
}

// 🧹 Limpieza
await log("\n🧹 Limpiando carpetas temporales...");
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

// 📧 Enviar notificación por correo
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
