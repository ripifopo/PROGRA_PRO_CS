'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';

mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [lng, setLng] = useState(-70.6483);
  const [lat, setLat] = useState(-33.4569);
  const [zoom, setZoom] = useState(12);
  const router = useRouter();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: zoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLng = position.coords.longitude;
          const userLat = position.coords.latitude;

          setLng(userLng);
          setLat(userLat);
          mapRef.current?.flyTo({ center: [userLng, userLat], zoom: 14 });

          const el = document.createElement('div');
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.border = '3px solid white';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#ffffffaa';
          el.style.boxShadow = '0 0 6px rgba(0,0,0,0.4)';

          new mapboxgl.Marker({ element: el })
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setText('Estás aquí'))
            .addTo(mapRef.current!);
        },
        (error) => {
          let message = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'El usuario denegó el permiso de ubicación.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'La ubicación no está disponible.';
              break;
            case error.TIMEOUT:
              message = 'La solicitud de ubicación expiró.';
              break;
            default:
              message = 'Ocurrió un error desconocido al obtener la ubicación.';
          }
          console.error("Error al obtener la ubicación:", message);
          alert(message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, []);

  // Forzar redibujo del mapa al expandir
  useEffect(() => {
    if (mapVisible && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 300);
    }
  }, [mapVisible]);

  return (
    <div className="container py-4">
      <div className="mb-3">
        <button
          className="btn btn-outline-dark"
          onClick={() => router.push('/comparator')}
        >
          Volver a Comparador
        </button>
      </div>

      <div className="text-center mb-4">
        <h3 className="fw-bold">Farmacias Cercanas</h3>
        <p className="text-muted">Visualiza tu ubicación actual y encuentra farmacias en tu zona</p>
      </div>

      <div className="text-center mb-3">
        <button
          className="btn btn-success px-4"
          onClick={() => setMapVisible(!mapVisible)}
        >
          {mapVisible ? 'Minimizar Mapa' : 'Ver Mapa'}
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
}
