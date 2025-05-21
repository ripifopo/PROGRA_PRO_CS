// Archivo: src/app/availability/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLoading } from '../../context/LoadingContext.tsx';
import { GeoAlt } from 'react-bootstrap-icons';

// Se establece el token de acceso de Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  // Referencias para el contenedor del mapa y los elementos de Mapbox
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerId = 'route';

  // Estados locales para modo oscuro, búsqueda de dirección y coordenadas del usuario
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const { setLoading } = useLoading();

  // Retorna el estilo correspondiente de Mapbox basado en el estado de modo oscuro
  const getMapStyle = () => isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

  // Centra el mapa en unas coordenadas dadas
  const centerMap = (coords: [number, number]) => {
    mapRef.current?.flyTo({ center: coords, zoom: 14 });
  };

  // Centra el mapa en la ubicación actual del usuario
  const goToUserLocation = () => {
    if (userCoords) centerMap(userCoords);
  };

  // Crea un marcador en el mapa. Puede ser para el usuario o para un destino
  const createMarker = (coords: [number, number], isDestination = false) => {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = isDestination ? '#6c63ff' : '#198754';
    el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    el.style.cursor = 'pointer';

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(isDestination ? 'Destino' : 'Estás aquí');

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(mapRef.current!);

    if (isDestination) {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = marker;
    } else {
      markerRef.current?.remove();
      markerRef.current = marker;
    }
  };

  // Dibuja una ruta entre dos puntos usando la API de direcciones de Mapbox
  const drawRoute = async (from: [number, number], to: [number, number]) => {
    const query = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(query);
    const data = await res.json();
    const route = data.routes?.[0]?.geometry;
    if (!route) return;

    const routeGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: route,
    };

    if (mapRef.current?.getLayer(routeLayerId)) {
      mapRef.current.removeLayer(routeLayerId);
      mapRef.current.removeSource(routeLayerId);
    }

    mapRef.current?.addSource(routeLayerId, {
      type: 'geojson',
      data: routeGeoJSON,
    });

    mapRef.current?.addLayer({
      id: routeLayerId,
      type: 'line',
      source: routeLayerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#1d4ed8',
        'line-width': 5,
      },
    });
  };


  // Carga las farmacias Ahumada desde un JSON y las renderiza en el mapa
const loadFarmaciasAhumada = async () => {
  try {
    const res = await fetch("/data/farmacias_ahumada.json");
    const farmacias = await res.json();

    farmacias.forEach((f: any) => {
      if (f.latitude && f.longitude) {
        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "red"; // Color para Ahumada
        el.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <strong>${f.name}</strong><br/>
          ${f.address}, ${f.city}<br/>
          ☎ ${f.phone}<br/>
          🕐 ${f.hours?.replace(/<[^>]+>/g, " ")}
        `);

        new mapboxgl.Marker({ element: el })
          .setLngLat([f.longitude, f.latitude])
          .setPopup(popup)
          .addTo(mapRef.current!);
      }
    });
  } catch (error) {
    console.error("Error al cargar farmacias Ahumada:", error);
  }
};

  // Maneja la búsqueda de una dirección y traza la ruta
  const handleSearch = async () => {
    if (!searchAddress || !userCoords) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      const destination = data.features?.[0]?.center;
      if (!destination) return;
      const destCoords: [number, number] = [destination[0], destination[1]];
      createMarker(destCoords, true);
      centerMap(destCoords);
      drawRoute(userCoords, destCoords);
    } catch (e) {
      console.error('Error al buscar dirección:', e);
    } finally {
      setLoading(false);
    }
  };

  // Maneja la cancelación de una búsqueda eliminando el destino y la ruta
  const handleCancel = () => {
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    if (mapRef.current?.getLayer(routeLayerId)) {
      mapRef.current.removeLayer(routeLayerId);
      mapRef.current.removeSource(routeLayerId);
    }
    goToUserLocation();
  };

  // Inicializa el mapa y solicita la ubicación actual del usuario
  useEffect(() => {
    setLoading(true);

    if (!navigator.geolocation || mapRef.current || !mapContainerRef.current) {
      setLoading(false);
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: [-70.6483, -33.4569],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(coords);
        centerMap(coords);
        createMarker(coords);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Cambia el estilo del mapa cuando se activa o desactiva el modo oscuro
  useEffect(() => {
    if (mapRef.current) mapRef.current.setStyle(getMapStyle());
  }, [isDarkMode]);

  // Renderizado de la página
  return (
    <div className="py-5 text-center">
      <div className="container">
        {/* Ícono decorativo de ubicación */}
        <GeoAlt size={60} className="text-primary mb-3" />

        {/* Título principal */}
        <h1 className="display-5 fw-bold text-dark mb-2">Encuentra farmacias cercanas</h1>

        {/* Slogan descriptivo */}
        <p className="text-muted mb-4">¿Necesitas un medicamento? ¡Busca y compara farmacias cerca de ti!</p>

        {/* Botones de acción principales */}
        <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
          <a href="/comparator" className="btn btn-success btn-lg shadow d-flex align-items-center gap-2">
            Comparar Medicamentos
          </a>
          {userCoords && (
            <button className="btn btn-outline-primary btn-lg shadow" onClick={goToUserLocation}>
              Volver a mi ubicación
            </button>
          )}
        </div>

        {/* Barra de búsqueda de direcciones */}
        <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Buscar dirección..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
          <button className="btn btn-outline-success" onClick={handleSearch}>Buscar</button>
          <button className="btn btn-outline-danger" onClick={handleCancel}>Cancelar</button>
        </div>

        {/* Switch para activar modo oscuro */}
        <div className="form-check form-switch d-flex justify-content-center align-items-center gap-2 mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
            id="darkModeSwitch"
          />
          <label className="form-check-label" htmlFor="darkModeSwitch">Modo oscuro</label>
        </div>
      </div>

      {/* Contenedor del mapa con diseño expandido */}
      <div
        ref={mapContainerRef}
        className="w-100 mt-4"
        style={{
          height: '70vh',
          borderRadius: '1rem',
          overflow: 'hidden',
          transition: 'opacity 0.5s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          opacity: 1,
        }}
      />
    </div>
  );
}
