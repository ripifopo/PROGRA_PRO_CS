# 📁 Archivo: stock/stock_checker.py

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
        raise ValueError("❌ URL no corresponde a una farmacia conocida.")

def obtener_stock_general(url: str, comuna: str) -> str:
    try:
        obtener_func = seleccionar_farmacia(url)
        resultado = obtener_func(url, comuna)
        return resultado if resultado else "❌ No se pudo determinar el stock."
    except Exception as e:
        return f"❌ Error al obtener stock: {str(e)}"

# 🧪 Modo consola para pruebas manuales
if __name__ == "__main__":
    import sys
    if len(sys.argv) == 3:
        url = sys.argv[1]
        comuna = sys.argv[2]
        print(obtener_stock_general(url, comuna))
    else:
        print("❌ Uso incorrecto. Debes pasar: python stock_checker.py <url> <comuna>")
