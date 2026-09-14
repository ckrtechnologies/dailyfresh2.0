import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Navigation, Search, Check, X } from 'lucide-react';

// Custom SVG Pin Icon for Leaflet
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 36px; height: 42px; display: flex; align-items: center; justify-content: center; transform: translate(-18px, -42px);">
        <svg width="36" height="42" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#ef4444"/>
          <circle cx="12" cy="11" r="5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const GoogleMapPicker = ({ lat, lng, onSelect, onAddressSelect }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const parsedLat = lat ? parseFloat(lat) : null;
  const parsedLng = lng ? parseFloat(lng) : null;

  // Center coordinate state (default: Noida NCR or provided lat/lng)
  const [currentCoords, setCurrentCoords] = useState({
    lat: parsedLat || 28.5355,
    lng: parsedLng || 77.3910
  });

  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = parsedLat || currentCoords.lat;
      const initialLng = parsedLng || currentCoords.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: parsedLat && parsedLng ? 15 : 13,
        zoomControl: false
      });

      // Add Zoom Control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add High-Quality OpenStreetMap Street Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Create Draggable Pin Marker
      const pinIcon = createPinIcon();
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      // Handle Pin Drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        if (onSelect) {
          onSelect(pos.lat.toFixed(7), pos.lng.toFixed(7));
        }
      });

      // Handle Map Click to Move Pin
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        setCurrentCoords({ lat: clickLat, lng: clickLng });
        if (onSelect) {
          onSelect(clickLat.toFixed(7), clickLng.toFixed(7));
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Auto-locate GPS on cold start if no coordinates passed
      if (!parsedLat || !parsedLng) {
        handleGetLocation();
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position if external lat/lng changes
  useEffect(() => {
    if (parsedLat && parsedLng && mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - parsedLat) > 0.0001 || Math.abs(currentPos.lng - parsedLng) > 0.0001) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
        mapInstanceRef.current.panTo([parsedLat, parsedLng]);
        setCurrentCoords({ lat: parsedLat, lng: parsedLng });
      }
    }
  }, [parsedLat, parsedLng]);

  // GPS Auto-Detection
  const handleGetLocation = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCurrentCoords({ lat: userLat, lng: userLng });

        if (markerRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLng], 16, { duration: 1.2 });
        }
        if (onSelect) {
          onSelect(userLat.toFixed(7), userLng.toFixed(7));
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Location Search via Nominatim Geocoding API
  const handleSearchLocation = async (e, customQuery) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    const query = customQuery !== undefined ? customQuery : searchQuery;
    if (!query || !query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        if (customQuery !== undefined || data.length === 1) {
          // Select immediately
          applySearchResult(data[0]);
        } else {
          // Show suggestions list
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } else {
        alert(`No locations found matching "${query}". Please check the spelling or enter a pincode.`);
      }
    } catch (err) {
      console.error('Search location error:', err);
    } finally {
      setSearching(false);
    }
  };

  const applySearchResult = (item) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setCurrentCoords({ lat: newLat, lng: newLng });

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newLat, newLng], 16, { duration: 1.2 });
    }
    if (onSelect) {
      onSelect(newLat.toFixed(7), newLng.toFixed(7));
    }
    if (onAddressSelect && item.display_name) {
      onAddressSelect(item.display_name);
    }

    setSearchQuery(item.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
      {/* Top Map Action Bar - Explicitly NON-form container to prevent form bubble */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '6px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: '8px',
            padding: '0 12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            border: '1px solid #cbd5e1'
          }}>
            <Search size={16} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search city, area, landmark, or PIN code (e.g. Noida Sector 62, 201301)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length === 0) {
                  setShowSuggestions(false);
                  setSuggestions([]);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchLocation(e);
                }
              }}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                padding: '10px 0',
                background: 'transparent'
              }}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearchLocation(e);
            }}
            disabled={searching}
            style={{
              padding: '0 16px',
              background: '#15803d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>

          {/* Autocomplete / Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              right: '90px',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              zIndex: 1001,
              maxHeight: '240px',
              overflowY: 'auto'
            }}>
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applySearchResult(item);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <MapPin size={14} color="#15803d" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.display_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleGetLocation(e);
          }}
          disabled={locating}
          title="Detect Current Device Location"
          style={{
            padding: '10px 14px',
            background: 'white',
            color: '#1e293b',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          {locating ? <Loader2 size={14} className="animate-spin" color="#15803d" /> : <Navigation size={14} color="#15803d" />}
          <span>{locating ? 'Locating...' : 'My Location'}</span>
        </button>
      </div>

      {/* Actual Map Container Ref */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '520px', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          zIndex: 1 
        }} 
      />

      {/* Floating Coordinate Readout & Guide Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '12px',
        right: '12px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="#4ade80" />
          <span><b>Drag the red pin</b> or <b>click on the map</b> to precisely place the store coordinates.</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
            Lat: {Number(currentCoords.lat).toFixed(6)}
          </span>
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
            Lng: {Number(currentCoords.lng).toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapPicker;
