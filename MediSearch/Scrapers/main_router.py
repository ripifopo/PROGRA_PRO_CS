import sys
from ahumada_scraper import fetch_ahumada_data
from cruzverde_scraper import fetch_cruzverde_data
from salcobrand_scraper import fetch_salcobrand_data

def main():
    if len(sys.argv) < 2:
        print("Usage: python main_router.py <product_url>")
        return

    url = sys.argv[1]

    if "farmaciasahumada.cl" in url:
        fetch_ahumada_data(url)
    elif "cruzverde.cl" in url:
        fetch_cruzverde_data(url)
    elif "salcobrand.cl" in url:
        fetch_salcobrand_data(url)
    else:
        print("Unsupported pharmacy URL.")

if __name__ == "__main__":
    main()
