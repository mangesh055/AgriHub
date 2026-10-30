import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, RotateCcw, Trash2, MapPin, Check, Sparkles, Navigation } from 'lucide-react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FarmRegistrationMapProps {
  latitude: number;
  longitude: number;
  village?: string;
  taluka?: string;
  district?: string;
  areaAcres: number;
  boundaryPoints: LatLng[];
  onLocationChange: (lat: number, lng: number) => void;
  onBoundaryChange: (points: LatLng[], calculatedAcres: number, centroid?: LatLng) => void;
  onSyncAreaToBoundary?: (calculatedAcres: number) => void;
  height?: string | number;
}

export function computeCentroid(pts: LatLng[]): LatLng {
  if (!pts || pts.length === 0) return { lat: 18.1519, lng: 74.5771 };
  return {
    lat: Number((pts.reduce((s, p) => s + p.lat, 0) / pts.length).toFixed(5)),
    lng: Number((pts.reduce((s, p) => s + p.lng, 0) / pts.length).toFixed(5)),
  };
}

// Planar Geodesic Area Calculation for Agricultural Land in Acres
export function computePolygonAreaAcres(pts: LatLng[]): number {
  if (!pts || pts.length < 3) return 0;
  const meanLat = (pts.reduce((s, p) => s + p.lat, 0) / pts.length) * (Math.PI / 180);
  const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * meanLat) + 1.175 * Math.cos(4 * meanLat);
  const metersPerDegLng = 111412.84 * Math.cos(meanLat) - 93.5 * Math.cos(3 * meanLat);

  let areaM2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const xi = pts[i].lng * metersPerDegLng;
    const yi = pts[i].lat * metersPerDegLat;
    const xj = pts[j].lng * metersPerDegLng;
    const yj = pts[j].lat * metersPerDegLat;
    areaM2 += (xi * yj) - (xj * yi);
  }
  areaM2 = Math.abs(areaM2) / 2;
  const acres = areaM2 / 4046.8564224;
  return Number(acres.toFixed(2));
}

// Generate a rectangular boundary polygon matching the requested area around the centroid
export function generateBoxBoundary(centerLat: number, centerLng: number, acres: number): LatLng[] {
  const safeAcres = Math.max(0.25, Math.min(500, acres || 4.0));
  const sideMeters = Math.sqrt(safeAcres * 4046.8564224);
  const halfSide = sideMeters / 2;

  const latRad = centerLat * (Math.PI / 180);
  const metersPerDegLat = 111132.92;
  const metersPerDegLng = 111412.84 * Math.cos(latRad);

  const dLat = halfSide / metersPerDegLat;
  const dLng = halfSide / metersPerDegLng;

  return [
    { lat: Number((centerLat + dLat).toFixed(6)), lng: Number((centerLng - dLng).toFixed(6)) },
    { lat: Number((centerLat + dLat).toFixed(6)), lng: Number((centerLng + dLng).toFixed(6)) },
    { lat: Number((centerLat - dLat).toFixed(6)), lng: Number((centerLng + dLng).toFixed(6)) },
    { lat: Number((centerLat - dLat).toFixed(6)), lng: Number((centerLng - dLng).toFixed(6)) },
  ];
}

const makeVertexIcon = (index: number) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position: relative; cursor: grab;">
        <div style="width: 18px; height: 18px; border-radius: 50%; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 0 0 2px #047857, 0 3px 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: 800;">
          ${index + 1}
        </div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const makeCentroidPinIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
        <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #38bdf8; border-radius: 6px; padding: 3px 8px; box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4); text-align: center; color: white; white-space: nowrap; backdrop-filter: blur(8px);">
          <div style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.05em;">📍 FARM GPS PIN</div>
          <div style="font-size: 8px; color: #94a3b8;">Drag to reposition</div>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #38bdf8;"></div>
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8; margin-top: -3px;"></div>
      </div>
    `,
    iconSize: [120, 60],
    iconAnchor: [60, 60],
  });

export const FarmRegistrationMap: React.FC<FarmRegistrationMapProps> = ({
  latitude,
  longitude,
  village,
  taluka,
  district,
  areaAcres,
  boundaryPoints,
  onLocationChange,
  onBoundaryChange,
  onSyncAreaToBoundary,
  height = 360,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);

  const [points, setPoints] = useState<LatLng[]>(boundaryPoints || []);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;
  const onBoundaryChangeRef = useRef(onBoundaryChange);
  onBoundaryChangeRef.current = onBoundaryChange;

  const currentAcres = computePolygonAreaAcres(points);

  // Sync internal points when prop changes from outside (e.g. box generation)
  useEffect(() => {
    if (boundaryPoints && boundaryPoints.length > 0) {
      setPoints(boundaryPoints);
    }
  }, [boundaryPoints]);

  // Redraw polygon and vertices
  const drawBoundary = useCallback((pts: LatLng[], map: L.Map) => {
    // Clear old polygon
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
    // Clear old vertex markers
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    if (pts.length >= 3) {
      polygonLayerRef.current = L.polygon(
        pts.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.22,
          weight: 2.5,
          dashArray: '6 4',
        }
      ).addTo(map);

      polygonLayerRef.current.bindTooltip(
        `<div style="font-size: 11px; font-weight: 700; color: #047857;">🌱 Farm Parcel (${computePolygonAreaAcres(pts)} Ac)</div>`,
        { sticky: true }
      );
    }

    // Add draggable vertex markers
    pts.forEach((pt, idx) => {
      const marker = L.marker([pt.lat, pt.lng], {
        icon: makeVertexIcon(idx),
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px;">
          <strong>Corner #${idx + 1}</strong><br/>
          Lat: ${pt.lat.toFixed(5)}°N<br/>
          Lng: ${pt.lng.toFixed(5)}°E<br/>
          <span style="color: #64748b; font-size: 10px;">Drag to adjust | Right-click to remove</span>
        </div>
      `);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        setPoints((prev) => {
          const updated = prev.map((p, i) => (i === idx ? { lat, lng } : p));
          const calculated = computePolygonAreaAcres(updated);
          const centroid = computeCentroid(updated);
          if (centerMarkerRef.current) {
            centerMarkerRef.current.setLatLng([centroid.lat, centroid.lng]);
          }
          onBoundaryChangeRef.current?.(updated, calculated, centroid);
          return updated;
        });
      });

      marker.on('contextmenu', () => {
        setPoints((prev) => {
          const updated = prev.filter((_, i) => i !== idx);
          const calculated = computePolygonAreaAcres(updated);
          const centroid = computeCentroid(updated);
          if (centerMarkerRef.current && updated.length > 0) {
            centerMarkerRef.current.setLatLng([centroid.lat, centroid.lng]);
          }
          onBoundaryChangeRef.current?.(updated, calculated, centroid);
          return updated;
        });
      });

      vertexMarkersRef.current.push(marker);
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const safeLat = !isNaN(latitude) && latitude !== 0 ? latitude : 18.4875;
    const safeLng = !isNaN(longitude) && longitude !== 0 ? longitude : 74.1332;

    const map = L.map(containerRef.current, {
      center: [safeLat, safeLng],
      zoom: 17,
      zoomControl: true,
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: '© Esri — Maxar' }
    );

    satelliteLayer.addTo(map);

    L.control.layers(
      { '🛰️ Satellite View': satelliteLayer, '🗺️ Street Map': streetLayer },
      {},
      { position: 'topright' }
    ).addTo(map);

    // Draggable Centroid Pin
    const pin = L.marker([safeLat, safeLng], {
      icon: makeCentroidPinIcon(),
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    pin.on('dragend', () => {
      const { lat, lng } = pin.getLatLng();
      onLocationChangeRef.current(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
    });

    centerMarkerRef.current = pin;
    mapRef.current = map;

    // Click map to append a vertex
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPt: LatLng = { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) };
      setPoints((prev) => {
        const updated = [...prev, newPt];
        const calculated = computePolygonAreaAcres(updated);
        const centroid = computeCentroid(updated);
        onBoundaryChangeRef.current?.(updated, calculated, centroid);
        return updated;
      });
    });

    // Invalidate size to handle modal transitions
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Centroid Pin and pan map when latitude / longitude props change
  useEffect(() => {
    if (!mapRef.current || !centerMarkerRef.current) return;
    const safeLat = !isNaN(latitude) ? latitude : 18.4875;
    const safeLng = !isNaN(longitude) ? longitude : 74.1332;

    const cur = centerMarkerRef.current.getLatLng();
    if (Math.abs(cur.lat - safeLat) > 0.0001 || Math.abs(cur.lng - safeLng) > 0.0001) {
      centerMarkerRef.current.setLatLng([safeLat, safeLng]);
      mapRef.current.panTo([safeLat, safeLng], { animate: true });
    }
  }, [latitude, longitude]);

  // Redraw boundary whenever points state changes
  useEffect(() => {
    if (!mapRef.current) return;
    drawBoundary(points, mapRef.current);
  }, [points, drawBoundary]);

  // Toolbar Actions
  const handleAutoGenerateBox = () => {
    const safeLat = !isNaN(latitude) && latitude !== 0 ? latitude : 18.4875;
    const safeLng = !isNaN(longitude) && longitude !== 0 ? longitude : 74.1332;
    const box = generateBoxBoundary(safeLat, safeLng, areaAcres || 4.0);
    setPoints(box);
    const calculated = computePolygonAreaAcres(box);
    const centroid = computeCentroid(box);
    onBoundaryChangeRef.current(box, calculated, centroid);

    if (mapRef.current) {
      const bounds = L.latLngBounds(box.map((p) => L.latLng(p.lat, p.lng)));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  const handleClear = () => {
    setPoints([]);
    onBoundaryChangeRef.current([], 0);
  };

  const handleFitBounds = () => {
    if (!mapRef.current) return;
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p.lat, p.lng)));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else {
      mapRef.current.setView([latitude, longitude], 17);
    }
  };

  const handleCenterOnGps = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([latitude, longitude], 17, { animate: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Map Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={14} />
            <span>
              {village || 'Centroid'}: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
            </span>
          </span>
          {points.length >= 3 && (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.14)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Boundary Area: {currentAcres} Acres ({points.length} vertices)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAutoGenerateBox}
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Automatically generate boundary box matching your entered area"
          >
            <Sparkles size={13} color="#f59e0b" />
            <span>Generate Box ({areaAcres} Ac)</span>
          </button>

          <button
            type="button"
            onClick={handleFitBounds}
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '4px 9px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Fit view to boundary"
          >
            <Maximize2 size={13} />
            <span>Fit</span>
          </button>

          <button
            type="button"
            onClick={handleCenterOnGps}
            className="btn-secondary"
            style={{ fontSize: '0.76rem', padding: '4px 9px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Center map on entered GPS pin"
          >
            <Navigation size={13} />
            <span>Center</span>
          </button>

          {points.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
              style={{ fontSize: '0.76rem', padding: '4px 9px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Clear drawn boundary"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Area Button Alert (if drawn acreage differs significantly from the text field) */}
      {points.length >= 3 && Math.abs(currentAcres - (areaAcres || 0)) > 0.05 && onSyncAreaToBoundary && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#93c5fd',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>
            Drawn boundary area is <strong>{currentAcres} Acres</strong> (form field is <strong>{areaAcres} Acres</strong>).
          </span>
          <button
            type="button"
            onClick={() => onSyncAreaToBoundary(currentAcres)}
            style={{
              background: '#0284c7',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 9px',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={12} />
            <span>Update Form Area to {currentAcres} Ac</span>
          </button>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={containerRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}
      />

      {/* Interactive Helper Text */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
        💡 <strong>Click anywhere on the satellite image</strong> to add boundary corners. <strong>Drag green dots</strong> to match your physical field bunds. <strong>Drag 📍 GPS Pin</strong> to fine-tune your farm center.
      </p>
    </div>
  );
};
