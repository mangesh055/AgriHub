import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng { lat: number; lng: number; }

export interface FarmMapEditorProps {
  center?: LatLng;
  initialPolygon?: LatLng[];
  onChange?: (points: LatLng[], geojson: object | null) => void;
  height?: string | number;
  readOnly?: boolean;
  showNdvi?: boolean;
}

// ── GeoJSON helpers ────────────────────────────────────────────────────────────

function buildGeoJSON(points: LatLng[]): object | null {
  if (points.length < 3) return null;
  const coords = points.map((p) => [p.lng, p.lat]);
  coords.push([points[0].lng, points[0].lat]);
  return { type: 'Polygon', coordinates: [coords] };
}

function computeCentroid(points: LatLng[]): LatLng {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

// ── NDVI helpers ───────────────────────────────────────────────────────────────

/** Ray-casting point-in-polygon test. */
function pointInPolygon(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lat, yi = poly[i].lng;
    const xj = poly[j].lat, yj = poly[j].lng;
    if ((yi <= lng && lng < yj) || (yj <= lng && lng < yi)) {
      if (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/**
 * Deterministic synthetic NDVI value at (lat, lng).
 * Uses layered sine waves at different scales to mimic real spatial variation.
 * Output range ~0.15 – 0.90 (realistic crop field).
 */
function syntheticNdvi(lat: number, lng: number): number {
  const x = lat * 9500;
  const y = lng * 9500;
  const base =
    0.30 * Math.sin(x * 1.27 + y * 0.83) +
    0.18 * Math.sin(x * 3.11 - y * 2.07) +
    0.10 * Math.sin(x * 6.37 + y * 5.19) +
    0.06 * Math.sin(x * 12.5 - y * 9.73) +
    0.04 * Math.sin(x * 24.1 + y * 19.4);
  // Centre around 0.58 (healthy but not perfect uniform field)
  return Math.max(0.05, Math.min(0.95, 0.58 + base * 0.65));
}

/** Map NDVI [0..1] → RGBA colour string. */
function ndviColor(v: number): [number, number, number, number] {
  // Standard NDVI colour ramp: red → yellow → green → dark-green
  if (v < 0.1)  return [139, 69,  19, 200];   // bare soil – brown
  if (v < 0.2)  return [210, 120, 40, 200];   // very sparse – orange-brown
  if (v < 0.3)  return [240, 190, 50, 200];   // sparse – yellow
  if (v < 0.45) return [195, 220, 55, 200];   // light – yellow-green
  if (v < 0.6)  return [120, 195, 55, 200];   // moderate – green
  if (v < 0.75) return [50,  160, 40, 200];   // healthy – mid-green
  if (v < 0.85) return [20,  110, 25, 200];   // very healthy – dark green
  return [5,   70,  10, 200];                  // excellent – deep green
}

/** Render NDVI heatmap onto an offscreen canvas and return its data-URL. */
function buildNdviCanvas(poly: LatLng[]): string {
  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const RES = 280; // resolution
  const canvas = document.createElement('canvas');
  canvas.width = RES;
  canvas.height = RES;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(RES, RES);

  for (let py = 0; py < RES; py++) {
    for (let px = 0; px < RES; px++) {
      // Map pixel → geographic coordinate
      const lat = maxLat - (py / RES) * (maxLat - minLat);
      const lng = minLng + (px / RES) * (maxLng - minLng);

      if (pointInPolygon(lat, lng, poly)) {
        const v = syntheticNdvi(lat, lng);
        const [r, g, b, a] = ndviColor(v);
        const idx = (py * RES + px) * 4;
        imgData.data[idx]     = r;
        imgData.data[idx + 1] = g;
        imgData.data[idx + 2] = b;
        imgData.data[idx + 3] = a;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ── Vertex icon ────────────────────────────────────────────────────────────────

const makeVertexIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#10b981;border:3px solid #fff;box-shadow:0 0 0 2px #10b981,0 2px 6px rgba(0,0,0,0.5);cursor:grab;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

// ── Component ──────────────────────────────────────────────────────────────────

export const FarmMapEditor: React.FC<FarmMapEditorProps> = ({
  center = { lat: 20.5937, lng: 78.9629 },
  initialPolygon,
  onChange,
  height = 420,
  readOnly = false,
  showNdvi = false,
}) => {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<L.Map | null>(null);
  const mapReadyRef    = useRef(false);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const markersRef     = useRef<L.Marker[]>([]);
  const ndviLayerRef   = useRef<L.ImageOverlay | null>(null);
  const onChangeRef    = useRef(onChange);
  onChangeRef.current  = onChange;

  const pointsRef = useRef<LatLng[]>(initialPolygon ?? []);
  const [points, setPoints] = useState<LatLng[]>(initialPolygon ?? []);
  const [locating, setLocating] = useState(false);

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  const drawPolygon = useCallback((pts: LatLng[], map: L.Map) => {
    polygonLayerRef.current?.remove();
    polygonLayerRef.current = null;
    if (pts.length >= 3) {
      polygonLayerRef.current = L.polygon(
        pts.map((p) => [p.lat, p.lng] as [number, number]),
        { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 2.5, dashArray: readOnly ? undefined : '6 4' }
      ).addTo(map);
    }
  }, [readOnly]);

  const drawMarkers = useCallback((pts: LatLng[], map: L.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (readOnly) return;
    pts.forEach((pt, idx) => {
      const marker = L.marker([pt.lat, pt.lng], { icon: makeVertexIcon(), draggable: true }).addTo(map);
      marker.on('contextmenu', () => {
        const updated = pointsRef.current.filter((_, i) => i !== idx);
        pointsRef.current = updated;
        setPoints([...updated]);
      });
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        const updated = pointsRef.current.map((p, i) => i === idx ? { lat, lng } : p);
        pointsRef.current = updated;
        setPoints([...updated]);
      });
      markersRef.current.push(marker);
    });
  }, [readOnly]);

  /** Add/refresh the NDVI image-overlay for the given polygon. */
  const applyNdviLayer = useCallback((pts: LatLng[], map: L.Map, visible: boolean) => {
    ndviLayerRef.current?.remove();
    ndviLayerRef.current = null;
    if (!visible || pts.length < 3) return;

    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );

    const dataUrl = buildNdviCanvas(pts);
    ndviLayerRef.current = L.imageOverlay(dataUrl, bounds, { opacity: 0.82, interactive: false }).addTo(map);
  }, []);

  const redraw = useCallback((pts: LatLng[], ndvi: boolean) => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    drawPolygon(pts, map);
    drawMarkers(pts, map);
    applyNdviLayer(pts, map, ndvi);
    onChangeRef.current?.(pts, buildGeoJSON(pts));
  }, [drawPolygon, drawMarkers, applyNdviLayer]);

  // ── Map init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initPts = pointsRef.current;
    const defaultCenter: [number, number] =
      initPts.length > 0
        ? [computeCentroid(initPts).lat, computeCentroid(initPts).lng]
        : [center.lat, center.lng];

    const map = L.map(containerRef.current, { center: defaultCenter, zoom: initPts.length > 0 ? 15 : 13, zoomControl: true });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    streetLayer.addTo(map);

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri — Maxar, Earthstar Geographics', maxZoom: 19 }
    );

    L.control.layers({ '🗺️ Street Map': streetLayer, '🛰️ Satellite View': satelliteLayer }, {}, { position: 'topright' }).addTo(map);

    mapRef.current = map;
    mapReadyRef.current = true;

    if (initPts.length > 0) {
      drawPolygon(initPts, map);
      drawMarkers(initPts, map);
      applyNdviLayer(initPts, map, showNdvi);
      const bounds = L.latLngBounds(initPts.map((p) => L.latLng(p.lat, p.lng)));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (!readOnly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newPt: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        const updated = [...pointsRef.current, newPt];
        pointsRef.current = updated;
        setPoints([...updated]);
      });
    }

    return () => {
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redraw on points change ───────────────────────────────────────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    redraw(points, showNdvi);
  }, [points, redraw, showNdvi]);

  // ── Toggle NDVI overlay without full redraw ───────────────────────────────────
  const prevNdvi = useRef(showNdvi);
  useEffect(() => {
    if (prevNdvi.current === showNdvi) return;
    prevNdvi.current = showNdvi;
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    applyNdviLayer(points, map, showNdvi);
  }, [showNdvi, points, applyNdviLayer]);

  // ── Toolbar actions ──────────────────────────────────────────────────────────

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { mapRef.current?.setView([coords.latitude, coords.longitude], 17); setLocating(false); },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function handleFitBounds() {
    if (points.length < 2 || !mapRef.current) return;
    mapRef.current.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p.lat, p.lng))), { padding: [50, 50] });
  }

  function handleUndo() {
    const updated = points.slice(0, -1);
    pointsRef.current = updated;
    setPoints(updated);
  }

  function handleClear() {
    pointsRef.current = [];
    setPoints([]);
  }

  const hasPolygon = points.length >= 3;
  const c = hasPolygon ? computeCentroid(points) : null;

  const instructionText =
    readOnly
      ? '🗺️ Farm boundary (read-only) — switch to 🛰️ Satellite View for aerial photo'
      : points.length === 0
      ? '📍 Click anywhere on the map to mark the first corner of your farm'
      : points.length < 3
      ? `📍 Keep clicking to add more corners (${points.length}/3 minimum so far)`
      : `✅ ${points.length} corners set — drag 🟢 dots to adjust, right-click a dot to remove`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Status banner */}
      <div style={{
        padding: '9px 14px', borderRadius: '8px',
        background: hasPolygon ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.10)',
        border: `1px solid ${hasPolygon ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.25)'}`,
        fontSize: '0.84rem', color: hasPolygon ? '#34d399' : '#93c5fd', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
      }}>
        <span>{instructionText}</span>
        {c && (
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            Centroid: {c.lat.toFixed(5)}°N, {c.lng.toFixed(5)}°E
          </span>
        )}
      </div>

      {/* Edit toolbar */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: locating ? '⏳ Locating…' : '📍 My Location', action: handleLocateMe, disabled: locating },
            { label: '🔎 Fit View', action: handleFitBounds, disabled: points.length < 2 },
            { label: '↩️ Undo', action: handleUndo, disabled: points.length === 0 },
          ].map(({ label, action, disabled }) => (
            <button key={label} type="button" onClick={action} disabled={disabled} style={tbBtn}>{label}</button>
          ))}
          <button type="button" onClick={handleClear} disabled={points.length === 0}
            style={{ ...tbBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}>
            🗑️ Clear All
          </button>
        </div>
      )}

      {/* NDVI Legend (shown when NDVI is active and polygon exists) */}
      {showNdvi && hasPolygon && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
            🛰️ NDVI Index:
          </span>
          {[
            { color: '#8B4513', label: '< 0.1  Bare soil' },
            { color: '#D27828', label: '0.1–0.3  Sparse' },
            { color: '#C8DC37', label: '0.3–0.45  Moderate' },
            { color: '#78C337', label: '0.45–0.6  Good' },
            { color: '#149E19', label: '0.6–0.8  Healthy' },
            { color: '#054610', label: '> 0.8  Excellent' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: '#d1d5db', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div ref={containerRef} style={{
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '10px', overflow: 'hidden',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
      }} />

      {!readOnly && points.length > 0 && (
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 <strong>Right-click</strong> a green dot to remove that corner.{' '}
          <strong>Drag</strong> a dot to fine-tune its position.
          Switch to <strong>🛰️ Satellite View</strong> (top-right) to see your field from above.
        </p>
      )}
    </div>
  );
};

const tbBtn: React.CSSProperties = {
  padding: '6px 13px', borderRadius: '7px',
  border: '1px solid var(--border-subtle)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.15s',
};
