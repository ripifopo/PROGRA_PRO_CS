'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import { useRouter } from 'next/navigation';
import { useLoading } from '../../../context/LoadingContext';

mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const directionsRef = useRef<any>(null); // Referencia al control de direcciones

  const [mapVisible, setMapVisible] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const router = useRouter();
  const { setLoading } = useLoading();

  // Centrar mapa en coordenadas específicas
  const flyToLocation = (coords: [number, number]) => {
    mapRef.current?.flyTo({ center: coords, zoom: 14 });
  };

  // Crear marcador en el mapa
  const createUserMarker = (lng: number, lat: number) => {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#198754';
    el.style.boxShadow = '0 0 10px rgba(25, 135, 84, 0.6)';

    if (markerRef.current) markerRef.current.remove();

    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current!);

    flyToLocation([lng, lat]);
  };

  // Detectar ubicación del usuario
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no permite acceder a la ubicación.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(coords);
        createUserMarker(...coords);
        setLoading(false);
      },
      () => {
        alert('No se pudo detectar tu ubicación.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Inicializar mapa con control de direcciones
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    setLoading(true);

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [-70.6483, -33.4569], // Santiago por defecto
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Control de direcciones tipo Waze
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving',
      controls: {
        inputs: false,
        instructions: true,
      },
    });

    directionsRef.current = directions;
    mapRef.current.addControl(directions, 'top-left');

    detectUserLocation();
  }, []);

  // Volver a centrar cada vez que cambia visibilidad o coordenadas
  useEffect(() => {
    if (mapRef.current && userCoords) {
      setTimeout(() => {
        mapRef.current!.resize();
        flyToLocation(userCoords);
      }, 300);
    }
  }, [mapVisible, userCoords]);

  // Buscar una dirección e ir hacia ella + dibujar ruta
  const handleSearchAddress = async () => {
    if (!searchAddress) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchAddress
        )}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      if (!data.features || data.features.length === 0) {
        alert('Dirección no encontrada');
        return;
      }

      const [lng, lat] = data.features[0].center;
      if (userCoords && directionsRef.current) {
        directionsRef.current.setOrigin(userCoords);
        directionsRef.current.setDestination([lng, lat]);
      }
      createUserMarker(lng, lat);
    } catch (error) {
      alert('Error al buscar dirección');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Botones superiores */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button className="btn btn-outline-dark" onClick={() => router.push('/comparator')}>
          ← Volver al Comparador
        </button>
        <button className="btn btn-success" onClick={detectUserLocation}>
          Volver a mi ubicación
        </button>
      </div>

      {/* Buscador de direcciones */}
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

      {/* Botón para agrandar mapa */}
      <div className="text-center mb-3">
        <button className="btn btn-success px-4 rounded-pill shadow-sm" onClick={() => setMapVisible(!mapVisible)}>
          {mapVisible ? 'Minimizar Mapa' : 'Ampliar Mapa'}
        </button>
      </div>

      {/* Contenedor del mapa */}
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
