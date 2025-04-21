// Archivo: src/app/availability/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLoading } from '../../../context/LoadingContext';

mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerId = 'route';

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const { setLoading } = useLoading();

  // Cambia el estilo del mapa
  const getMapStyle = () =>
    isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

  const centerMap = (coords: [number, number]) => {
    mapRef.current?.flyTo({ center: coords, zoom: 14 });
  };

  const goToUserLocation = () => {
    if (userCoords) centerMap(userCoords);
  };

  const createMarker = (coords: [number, number], isDestination = false) => {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = isDestination ? '#6c63ff' : '#198754';
    el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    el.style.cursor = 'pointer';

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setText(isDestination ? 'Destino' : 'Estás aquí');

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

    // Elimina la ruta anterior si existe
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

  const handleCancel = () => {
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    if (mapRef.current?.getLayer(routeLayerId)) {
      mapRef.current.removeLayer(routeLayerId);
      mapRef.current.removeSource(routeLayerId);
    }
    goToUserLocation();
  };

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

  // Cambia el estilo del mapa si cambia el modo oscuro
  useEffect(() => {
    if (mapRef.current) mapRef.current.setStyle(getMapStyle());
  }, [isDarkMode]);

  return (
    <div className="container py-4">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-dark" onClick={() => location.href = '/comparator'}>
          ← Volver al Comparador
        </button>
        {userCoords && (
          <button className="btn btn-success" onClick={goToUserLocation}>
            Volver a mi ubicación
          </button>
        )}
      </div>

      <div className="text-center mb-3">
        <h3 className="fw-bold text-dark">Farmacias Cercanas</h3>
        <p className="text-muted mb-3">Visualiza tu ubicación actual o busca otra dirección</p>
        <div className="d-flex justify-content-center gap-2 mb-2">
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
        <div className="form-check form-switch d-flex justify-content-center align-items-center gap-2">
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

      <div className="text-center mb-3">
        <button className="btn btn-success px-4 rounded-pill shadow-sm" onClick={() => {
          setMapVisible(!mapVisible);
          setTimeout(() => goToUserLocation(), 300);
        }}>
          {mapVisible ? 'Minimizar Mapa' : 'Ampliar Mapa'}
        </button>
      </div>

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