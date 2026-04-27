import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  marginTop: '12px',
  border: '1px solid var(--border)'
};

const GoogleMapPicker = ({ lat, lng, onSelect }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null);

  const center = marker || {
    lat: 22.5726, // Kolkata default
    lng: 88.3639
  };

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleClick = (e) => {
    const newPos = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setMarker(newPos);
    onSelect(newPos.lat.toFixed(7), newPos.lng.toFixed(7));
  };

  if (!isLoaded) return (
    <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <Loader2 className="animate-spin" size={24} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
        {marker && <Marker position={marker} animation={window.google.maps.Animation.DROP} />}
      </GoogleMap>
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '12px', 
        right: '12px', 
        background: 'rgba(255,255,255,0.9)', 
        padding: '8px 12px', 
        borderRadius: '6px', 
        fontSize: '11px', 
        fontWeight: '600', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        pointerEvents: 'none'
      }}>
        <MapPin size={12} color="var(--primary)" />
        Click on the map to place a pin and capture coordinates.
      </div>
    </div>
  );
};

export default GoogleMapPicker;
