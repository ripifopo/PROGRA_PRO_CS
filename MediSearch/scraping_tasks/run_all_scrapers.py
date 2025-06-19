# Archivo: run_all_scrapers.py

import subprocess
import time
import sys
import os

# Lista de scrapers con nombres amigables
scrapers = [
    {
        "name": "Farmacia Ahumada",
        "path": "../Scrapers_MediSearch/old_fast_scrapers/ahumada_fast_scraper.py"
    },
    {
        "name": "Cruz Verde",
        "path": "../Scrapers_MediSearch/old_fast_scrapers/cruzverde_fast_scraper.py"
    },
    {
        "name": "Salcobrand",
        "path": "../Scrapers_MediSearch/old_fast_scrapers/salcobrand_fast_scraper.py"
    }
]

def print_progress_bar(index, total, prefix='', length=40):
    percent = int(100 * (index / float(total)))
    bar = '█' * int(length * index // total) + '-' * (length - int(length * index // total))
    sys.stdout.write(f'\r{prefix} |{bar}| {percent}%')
    sys.stdout.flush()

def run_scraper(scraper, i, total):
    print(f"\n🟢 Iniciando scraper: {scraper['name']}")
    start = time.time()
    try:
        subprocess.run(["python", scraper["path"]], check=True)
    except subprocess.CalledProcessError:
        print(f"❌ Error al ejecutar {scraper['name']}")
        return

    end = time.time()
    print_progress_bar(i + 1, total, prefix='✅ Completado')
    print(f"\n⏱️ Tiempo de ejecución: {round(end - start, 2)} segundos\n")

def main():
    total = len(scrapers)
    print("🚀 Ejecutando scrapers de farmacias...\n")

    for i, scraper in enumerate(scrapers):
        run_scraper(scraper, i, total)

    print("\n🎉 Todos los scrapers fueron ejecutados correctamente.")
    print("📁 Los archivos JSON fueron actualizados.\n")
    print("👉 Ahora puedes ejecutar:\n")
    print("   deno task insert-medicines\n")

if __name__ == "__main__":
    main()
