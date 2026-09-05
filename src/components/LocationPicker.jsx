import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { SearchMd, XClose } from "@untitledui/icons";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const PICKED_ZOOM = 16;

const pinIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function parseCoord(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatCoord(value) {
  return Number(value).toFixed(6);
}

function MapSync({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (lat == null || lng == null) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    map.flyTo([lat, lng], Math.max(map.getZoom(), PICKED_ZOOM), {
      duration: 0.6,
    });
  }, [lat, lng, map]);
  return null;
}

function MapClick({ disabled, onPick }) {
  useMapEvents({
    click(event) {
      if (disabled) return;
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onChange, disabled }) {
  const provider = useMemo(() => new OpenStreetMapProvider(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  const parsedLat = parseCoord(lat);
  const parsedLng = parseCoord(lng);
  const hasPin = parsedLat != null && parsedLng != null;
  const position = hasPin ? [parsedLat, parsedLng] : null;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    const id = ++requestId.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await provider.search({ query: term });
        if (requestId.current === id) {
          setResults(found.slice(0, 6));
        }
      } catch {
        if (requestId.current === id) setResults([]);
      } finally {
        if (requestId.current === id) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [provider, query]);

  const pick = (nextLat, nextLng) => {
    onChange({
      lat: formatCoord(nextLat),
      lng: formatCoord(nextLng),
    });
    setResults([]);
  };

  const chooseResult = (result) => {
    pick(result.y, result.x);
    setQuery(result.label);
  };

  const handleManual = (field) => (e) => {
    onChange({
      lat: field === "lat" ? e.target.value : lat,
      lng: field === "lng" ? e.target.value : lng,
    });
  };

  return (
    <div className={`location-picker ${disabled ? "is-disabled" : ""}`}>
      <label className="auth-field">
        <span>Location on map</span>
        <div className="location-picker__search">
          <SearchMd />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place, then click the map or enter coordinates"
            disabled={disabled}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="location-picker__clear-search"
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              disabled={disabled}
              aria-label="Clear search"
            >
              <XClose />
            </button>
          )}
        </div>
      </label>

      {results.length > 0 && (
        <ul className="location-picker__results" role="listbox">
          {results.map((result) => (
            <li key={`${result.x}-${result.y}-${result.label}`}>
              <button
                type="button"
                onClick={() => chooseResult(result)}
                disabled={disabled}
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searching && query.trim().length >= 3 && results.length === 0 && (
        <p className="location-picker__status">Searching places…</p>
      )}

      <div className="location-picker__map">
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={hasPin ? PICKED_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          attributionControl={false}
          className="location-picker__leaflet"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClick disabled={disabled} onPick={pick} />
          <MapSync lat={parsedLat} lng={parsedLng} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable={!disabled}
              eventHandlers={{
                dragend: (event) => {
                  const next = event.target.getLatLng();
                  pick(next.lat, next.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="form-grid location-picker__coords">
        <label className="auth-field">
          <span>Latitude</span>
          <input
            value={lat}
            onChange={handleManual("lat")}
            placeholder="19.076000"
            inputMode="decimal"
            disabled={disabled}
          />
        </label>
        <label className="auth-field">
          <span>Longitude</span>
          <input
            value={lng}
            onChange={handleManual("lng")}
            placeholder="72.877700"
            inputMode="decimal"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
