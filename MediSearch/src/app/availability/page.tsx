'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLoading } from '../../context/LoadingContext.tsx';
import { GeoAlt } from 'react-bootstrap-icons';
import { BsPersonFill } from 'react-icons/bs';
import type { Feature, LineString } from 'geojson';

mapboxgl.accessToken = 'pk.eyJ1IjoicmlwaWZvcG8iLCJhIjoiY204dzUyNTRhMTZwYzJzcTJmaDZ4YW9heSJ9.ZTqxKk7RvUkKYw-ViqZeBA';

export default function AvailabilityPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerId = 'route';

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState('all');
  const { setLoading } = useLoading();

  const getMapStyle = () => isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12';

  const centerMap = (coords: [number, number]) => {
    mapRef.current?.flyTo({ center: coords, zoom: 14 });
  };

  const goToUserLocation = () => {
    if (userCoords) centerMap(userCoords);
  };

  const createMarker = (coords: [number, number], isDestination = false, isUser = false) => {
    const el = document.createElement('div');

    if (isUser) {
      el.style.width = '42px';
      el.style.height = '42px';
      el.style.backgroundColor = '#fff';
      el.style.border = '3px solid #2563eb';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.5)';
      el.style.color = '#2563eb';
      el.style.fontSize = '24px';

      const reactIcon = document.createElement('div');
      reactIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="#2563eb" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 100-6 3 3 0 000 6z"/></svg>`;
      reactIcon.style.width = '24px';
      reactIcon.style.height = '24px';
      el.appendChild(reactIcon);
    } else {
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = isDestination ? '#6c63ff' : '#198754';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    }

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
      isDestination ? 'Destino' : isUser ? 'Estás aquí' : ''
    );

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(mapRef.current!);

    if (isDestination) {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = marker;
    } else if (isUser) {
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

    const routeGeoJSON: Feature<LineString> = {
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
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#1d4ed8', 'line-width': 5 },
    });
  };

  const loadFarmacias = async (
    jsonPath: string,
    color: string,
    markerArrayRef: React.MutableRefObject<mapboxgl.Marker[]>,
    opts: { latKey: string; lngKey: string; comunaKey: string; horarioKey: string }
  ) => {
    try {
      const res = await fetch(jsonPath);
      const farmacias = await res.json();

      farmacias.forEach((f: any, index: number) => {
        const lat = parseFloat(f[opts.latKey]);
        const lng = parseFloat(f[opts.lngKey]);

        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.boxShadow = '0 0 6px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';

        const name = f.name || `Farmacia ${index + 1}`;
        const address = f.address || 'Dirección no disponible';
        const comuna = f[opts.comunaKey] || '';
        const phone = f.phone || '';
        const horario = f[opts.horarioKey] || '';

        let popupHtml = `<strong>${name}</strong><br/>${address}, ${comuna}<br/>`;
        if (phone) popupHtml += `☎ ${phone}<br/>`;
        if (horario) popupHtml += `🕐 ${horario}`;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markerArrayRef.current.push(marker);
      });
    } catch (error) {
      console.error(`Error al cargar ${jsonPath}:`, error);
    }
  };

  const ahumadaMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const cruzverdeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const salcobrandMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const clearMarkers = () => {
    [...ahumadaMarkersRef.current, ...cruzverdeMarkersRef.current, ...salcobrandMarkersRef.current].forEach((m) => m.remove());
    ahumadaMarkersRef.current = [];
    cruzverdeMarkersRef.current = [];
    salcobrandMarkersRef.current = [];
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
        createMarker(coords, false, true);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setStyle(getMapStyle());
  }, [isDarkMode]);

  useEffect(() => {
    if (!mapRef.current) return;
    clearMarkers();

    if (selectedPharmacy === 'ahumada') {
      loadFarmacias('/data/farmacias_ahumada.json', 'red', ahumadaMarkersRef, {
        latKey: 'latitude', lngKey: 'longitude', comunaKey: 'city', horarioKey: 'hours',
      });
    } else if (selectedPharmacy === 'cruzverde') {
      loadFarmacias('/data/cruzverde.json', 'green', cruzverdeMarkersRef, {
        latKey: 'lat', lngKey: 'lng', comunaKey: 'comuna', horarioKey: 'horario',
      });
    } else if (selectedPharmacy === 'salcobrand') {
      loadFarmacias('/data/salcobrand.json', 'deepskyblue', salcobrandMarkersRef, {
        latKey: 'latitude', lngKey: 'longitude', comunaKey: 'comuna', horarioKey: 'horario',
      });
    }
  }, [selectedPharmacy]);

  return (
    <div className="py-5 text-center">
      <div className="container">
        <GeoAlt size={60} className="text-primary mb-3" />
        <h1 className="display-5 fw-bold text-dark mb-2">Encuentra farmacias cercanas</h1>
        <p className="text-muted mb-4">¿Necesitas un medicamento? ¡Busca y compara farmacias cerca de ti!</p>

        <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
          <a href="/comparator" className="btn btn-success btn-lg shadow d-flex align-items-center gap-2">Comparar Medicamentos</a>
          {userCoords && (
            <button className="btn btn-outline-primary btn-lg shadow" onClick={goToUserLocation}>Volver a mi ubicación</button>
          )}
        </div>

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

          <select
            className="form-select w-auto"
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
          >
            <option value="all">Sin filtro</option>
            <option value="ahumada">Farmacias Ahumada</option>
            <option value="cruzverde">Farmacias Cruz Verde</option>
            <option value="salcobrand">Farmacias Salcobrand</option>
          </select>
        </div>

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
