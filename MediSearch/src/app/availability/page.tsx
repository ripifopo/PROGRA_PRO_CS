'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRouter } from 'next/navigation';

// Token de Mapbox para visualizar el mapa
mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null); // Referencia al contenedor del mapa
  const mapRef = useRef<mapboxgl.Map | null>(null); // Referencia al objeto mapa
  const markerRef = useRef<mapboxgl.Marker | null>(null); // Referencia al marcador del usuario
  const [mapVisible, setMapVisible] = useState(false); // Estado para mostrar/ocultar mapa ampliado
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null); // Coordenadas del usuario
  const router = useRouter(); // Para redirección

  // Función que centra el mapa en la ubicación del usuario
  const goToUserLocation = () => {
    if (userCoords && mapRef.current) {
      mapRef.current.flyTo({ center: userCoords, zoom: 14 });
    }
  };

  // Crea el marcador en la ubicación actual del usuario
  const createUserMarker = (lng: number, lat: number) => {
    // Estilo del marcador verde
    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#198754';
    el.style.boxShadow = '0 0 10px rgba(25, 135, 84, 0.6)';
    el.style.cursor = 'pointer';

    // Al hacer clic en el marcador, se vuelve a centrar el mapa
    el.addEventListener('click', () => goToUserLocation());

    // Contenido del popup
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

    // Crear el popup sin flechita (tip)
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      className: 'no-tip'
    }).setDOMContent(popupContent);

    // Eliminar manualmente la flechita (por si queda)
    setTimeout(() => {
      const tip = document.querySelector('.mapboxgl-popup-tip');
      if (tip) tip.remove();
    }, 100);

    // Eliminar marcador anterior si existía
    if (markerRef.current) markerRef.current.remove();

    // Crear nuevo marcador
    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapRef.current!);
  };

  // Inicializa el mapa cuando el componente se monta
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Crear el mapa
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-70.6483, -33.4569], // Centro inicial en Santiago
      zoom: 12
    });

    // Controles de navegación del mapa (zoom, rotación)
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Obtener ubicación del usuario
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setUserCoords([longitude, latitude]);
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 14 });
          createUserMarker(longitude, latitude);
        },
        (error) => {
          // Mensajes de error para ubicación
          const errors = [
            'El usuario denegó el permiso de ubicación.',
            'La ubicación no está disponible.',
            'La solicitud de ubicación expiró.',
            'Ocurrió un error desconocido.'
          ];
          alert(errors[error.code] || errors[3]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  // Ajusta el mapa al redimensionar (cuando se amplía o minimiza)
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current!.resize(); // Redibuja el mapa
        if (userCoords) {
          mapRef.current!.flyTo({
            center: userCoords,
            zoom: 14,
            essential: true // Indica que es una animación importante
          });
        }
      }, 300); // Espera a que la animación del contenedor termine
    }
  }, [mapVisible]);

  return (
    <div className="container py-4">
      {/* Botón de volver al comparador y volver a la ubicación */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button
          className="btn btn-outline-dark"
          onClick={() => router.push('/comparator')}
        >
          ← Volver al Comparador
        </button>

        {userCoords && (
          <button className="btn btn-success" onClick={goToUserLocation}>
            Volver a mi ubicación
          </button>
        )}
      </div>

      {/* Título y subtítulo del mapa */}
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark">Farmacias Cercanas</h3>
        <p className="text-muted">
          Visualiza tu ubicación actual y encuentra farmacias en tu zona
        </p>
      </div>

      {/* Botón para ampliar o minimizar mapa */}
      <div className="text-center mb-3">
        <button
          className="btn btn-success px-4 rounded-pill shadow-sm"
          onClick={() => setMapVisible(!mapVisible)}
        >
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
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
}
