# 📁 Ruta sugerida: stock/stock_checker.py

from stock.stock_obtainers.salcobrand_stock_obtainer import obtener_stock as stock_salcobrand
from stock.stock_obtainers.cruzverde_stock_obtainer import obtener_stock as stock_cruzverde
from stock.stock_obtainers.ahumada_stock_obtainer import obtener_stock as stock_ahumada

def seleccionar_farmacia(url: str):
    if "salcobrand.cl" in url:
        return stock_salcobrand
    elif "cruzverde.cl" in url:
        return stock_cruzverde
    elif "farmaciasahumada.cl" in url:
        return stock_ahumada
    else:
        raise ValueError("❌ URL no corresponde a una farmacia conocida")

def obtener_stock_general(url: str, comuna: str) -> str:
    try:
        obtener_func = seleccionar_farmacia(url)
        return obtener_func(url, comuna)
    except Exception as e:
        return f"❌ Error al obtener stock: {e}"

# 🧪 Menú de prueba por consola
if __name__ == "__main__":
    print("📦 CONSULTA UNIFICADA DE STOCK")
    print("=================================\n")
    url = input("🔗 URL del producto: ").strip()
    comuna = input("🏙️ Comuna: ").strip()

    print("\n🔎 Resultado:")
    print(obtener_stock_general(url, comuna))
