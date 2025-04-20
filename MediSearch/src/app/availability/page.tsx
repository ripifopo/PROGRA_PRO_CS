// Archivo: src/app/availability/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';
import { useLoading } from '../../../context/LoadingContext';

// Token de Mapbox para visualizar el mapa
mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [userRegion, setUserRegion] = useState<string>('');
  const [userComuna, setUserComuna] = useState<string>('');
  const router = useRouter();
  const { setLoading } = useLoading();

  // Centra el mapa en la ubicación actual del usuario
  const goToUserLocation = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.flyTo({ center: userCoords, zoom: 14 });
    }
  };

  // Crea el marcador personalizado en la ubicación del usuario
  const createUserMarker = (lng: number, lat: number) => {
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#198754';
    el.style.boxShadow = '0 0 10px rgba(25, 135, 84, 0.6)';
    el.style.cursor = 'pointer';

    el.addEventListener('click', () => goToUserLocation());

    const popupContent = document.createElement('div');
    popupContent.style.backgroundColor = '#ffffff';
    popupContent.style.color = '#333';
    popupContent.style.padding = '8px 12px';
    popupContent.style.borderRadius = '10px';
    popupContent.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    popupContent.style.fontSize = '0.9rem';
    popupContent.style.fontWeight = '500';
    popupContent.style.textAlign = 'center';
    popupContent.innerText = '📍 Estás aquí';

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, className: 'no-tip' }).setDOMContent(popupContent);

    setTimeout(() => {
      const tip = document.querySelector('.mapboxgl-popup-tip');
      if (tip) tip.remove();
    }, 100);

    if (markerRef.current) markerRef.current.remove();

    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapRef.current!);
  };

  // Inicializa el mapa y obtiene ubicación desde localStorage
  useEffect(() => {
    setLoading(true);

    const stored = localStorage.getItem('userLocation');
    if (!stored) {
      setLoading(false);
      return;
    }

    const locationData = JSON.parse(stored);
    setUserRegion(locationData.region);
    setUserComuna(locationData.comuna);

    if (!navigator.geolocation || mapRef.current || !mapContainerRef.current) {
      setLoading(false);
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-70.6483, -33.4569],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserCoords([longitude, latitude]);
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
        createUserMarker(longitude, latitude);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Redibuja el mapa si se amplía o minimiza
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current!.resize();
        if (userCoords) {
          mapRef.current!.flyTo({ center: userCoords, zoom: 14 });
        }
      }, 300);
    }
  }, [mapVisible]);

  return (
    <div className="container py-4">
      {/* Botones de navegación */}
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

      {/* Título y subtítulo */}
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark">Farmacias Cercanas</h3>
        <p className="text-muted">
          Visualiza tu ubicación actual en <strong>{userComuna}, {userRegion}</strong> y encuentra farmacias en tu zona
        </p>
      </div>

      {/* Botón para ampliar o minimizar el mapa */}
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
