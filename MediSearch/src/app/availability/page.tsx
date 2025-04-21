// Archivo: src/app/availability/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';
import { useLoading } from '../../../context/LoadingContext';

// Asigna el token de acceso público para la API de Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  // Referencias para contenedor del mapa, instancia del mapa y marcador personalizado
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Estados locales
  const [mapVisible, setMapVisible] = useState(true); // Por defecto el mapa está visible
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null); // Coordenadas del usuario
  const [searchAddress, setSearchAddress] = useState(''); // Dirección ingresada manualmente por el usuario
  const router = useRouter(); // Navegación entre páginas
  const { setLoading } = useLoading(); // Estado de carga global

  /**
   * Centra el mapa en la posición actual del usuario si está disponible.
   */
  const goToUserLocation = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.flyTo({ center: userCoords, zoom: 14 });
    }
  };

  /**
   * Crea o reemplaza un marcador personalizado en el mapa, con una animación y un popup.
   */
  const createUserMarker = (lng: number, lat: number) => {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#198754'; // Color verde característico
    el.style.boxShadow = '0 0 10px rgba(25, 135, 84, 0.6)';
    el.style.cursor = 'pointer';

    // Permite volver a la ubicación al hacer clic en el marcador
    el.addEventListener('click', () => goToUserLocation());

    // Crea el contenido visual del popup
    const popupContent = document.createElement('div');
    popupContent.innerText = '📍 Estás aquí';
    popupContent.style.cssText = `
      background-color: white;
      color: #333;
      padding: 8px 12px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
    `;

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true }).setDOMContent(popupContent);

    // Elimina marcador anterior si existía
    if (markerRef.current) markerRef.current.remove();

    // Crea nuevo marcador y lo agrega al mapa
    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapRef.current!);
  };

  /**
   * Inicializa el mapa al montar el componente y detecta la ubicación del usuario.
   */
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Crea el mapa base centrado inicialmente en Santiago
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-70.6483, -33.4569],
        zoom: 12,
      });

      // Agrega controles de navegación al mapa
      mapRef.current.addControl(new mapboxgl.NavigationControl());

      // Detecta ubicación real del usuario usando el GPS del navegador
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserCoords([longitude, latitude]); // Guarda coordenadas
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 }); // Centra el mapa
          createUserMarker(longitude, latitude); // Crea marcador
        },
        () => {}, // En caso de error no se hace nada
        {
          enableHighAccuracy: true, // Usa GPS real si es posible
          timeout: 10000, // Tiempo máximo de espera
          maximumAge: 0 // No usar caché previa
        }
      );
    }
  }, []);

  /**
   * Realiza una búsqueda de dirección usando la API de Mapbox.
   * Centra el mapa en la dirección encontrada.
   */
  const handleSearchAddress = async () => {
    if (!searchAddress) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
        createUserMarker(lng, lat);
      } else {
        alert('Dirección no encontrada');
      }
    } catch (err) {
      console.error('Error al buscar dirección:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Barra superior con navegación */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-dark" onClick={() => router.push('/comparator')}>
          ← Volver al Comparador
        </button>
        {userCoords && (
          <button className="btn btn-success" onClick={goToUserLocation}>
            Volver a mi ubicación
          </button>
        )}
      </div>

      {/* Buscador de dirección */}
      <div className="text-center mb-3">
        <h3 className="fw-bold text-dark">Farmacias Cercanas</h3>
        <p className="text-muted mb-3">Visualiza tu ubicación actual o busca otra dirección</p>
        <div className="input-group w-75 mx-auto">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar dirección..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button className="btn btn-outline-success" onClick={handleSearchAddress}>
            Buscar
          </button>
        </div>
      </div>

      {/* Botón para cambiar el tamaño del mapa */}
      <div className="text-center mb-3">
        <button className="btn btn-success px-4 rounded-pill shadow-sm" onClick={() => setMapVisible(!mapVisible)}>
          {mapVisible ? 'Minimizar Mapa' : 'Ampliar Mapa'}
        </button>
      </div>

      {/* Contenedor visual del mapa */}
      <div
        ref={mapContainerRef}
        className="w-100 mx-auto"
        style={{
          height: mapVisible ? '65vh' : '300px',
          borderRadius: '1rem',
          overflow: 'hidden',
          transition: 'height 0.4s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      />
    </div>
  );
}
