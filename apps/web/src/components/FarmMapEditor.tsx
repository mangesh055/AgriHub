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

export interface CoOwnerPartition {
  id?: string;
  name: string;
  relationship?: string;
  shareAcres: number;
  percentage?: number;
  surveyHissaNo?: string;
  isManagingCultivator?: boolean;
  assignedCrop?: string;
}

export interface SeparationDivider {
  id: string;
  ownerIndexA: number;
  ownerIndexB: number;
  ownerNameA: string;
  ownerNameB: string;
  pStart: LatLng;
  pEnd: LatLng;
  mid: LatLng;
  frac: number;
  isVertical: boolean;
  minVal: number;
  deltaVal: number;
}

export interface FarmMapEditorProps {
  center?: LatLng;
  initialPolygon?: LatLng[];
  onChange?: (points: LatLng[], geojson: object | null) => void;
  height?: string | number;
  readOnly?: boolean;
  showNdvi?: boolean;
  coOwners?: CoOwnerPartition[];
  gatNumber?: string;
  splitOrientation?: 'auto' | 'horizontal' | 'vertical';
  onCoOwnersChange?: (coOwners: CoOwnerPartition[]) => void;
  onSplitOrientationChange?: (orientation: 'horizontal' | 'vertical') => void;
}

// ── GeoJSON & Spatial helpers ──────────────────────────────────────────────────

export function buildGeoJSON(points: LatLng[]): object | null {
  if (points.length < 3) return null;
  const coords = points.map((p) => [p.lng, p.lat]);
  coords.push([points[0].lng, points[0].lat]);
  return { type: 'Polygon', coordinates: [coords] };
}

export function computeCentroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

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

// ── Sutherland-Hodgman Polygon Partitioning & Separation Boundary Lines ────────

function clipHalfPlane(
  poly: LatLng[],
  inside: (p: LatLng) => boolean,
  intersect: (p1: LatLng, p2: LatLng) => LatLng
): LatLng[] {
  const res: LatLng[] = [];
  if (poly.length === 0) return res;
  let s = poly[poly.length - 1];
  for (const e of poly) {
    if (inside(e)) {
      if (inside(s)) {
        res.push(e);
      } else {
        res.push(intersect(s, e));
        res.push(e);
      }
    } else if (inside(s)) {
      res.push(intersect(s, e));
    }
    s = e;
  }
  return res;
}

const OWNER_PALETTE = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];

/** Find intersection points between a cutting plane line and the edges of the polygon. */
function findIntersectionWithEdges(
  poly: LatLng[],
  val: number,
  isVertical: boolean
): LatLng[] {
  const intersections: LatLng[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % n];

    if (isVertical) {
      if ((p1.lng - val) * (p2.lng - val) <= 0 && p1.lng !== p2.lng) {
        const t = (val - p1.lng) / (p2.lng - p1.lng);
        if (t >= 0 && t <= 1) {
          const lat = p1.lat + t * (p2.lat - p1.lat);
          if (!intersections.some((pt) => Math.abs(pt.lat - lat) < 1e-6 && Math.abs(pt.lng - val) < 1e-6)) {
            intersections.push({ lat, lng: val });
          }
        }
      }
    } else {
      if ((p1.lat - val) * (p2.lat - val) <= 0 && p1.lat !== p2.lat) {
        const t = (val - p1.lat) / (p2.lat - p1.lat);
        if (t >= 0 && t <= 1) {
          const lng = p1.lng + t * (p2.lng - p1.lng);
          if (!intersections.some((pt) => Math.abs(pt.lat - val) < 1e-6 && Math.abs(pt.lng - lng) < 1e-6)) {
            intersections.push({ lat: val, lng });
          }
        }
      }
    }
  }

  if (isVertical) {
    intersections.sort((a, b) => a.lat - b.lat);
  } else {
    intersections.sort((a, b) => a.lng - b.lng);
  }

  return intersections;
}

export function partitionPolygonByShares(
  poly: LatLng[],
  owners: CoOwnerPartition[],
  orientation: 'auto' | 'horizontal' | 'vertical' = 'auto'
): {
  partitions: Array<{ owner: CoOwnerPartition; subPoly: LatLng[]; color: string }>;
  dividers: SeparationDivider[];
  isVertical: boolean;
  minVal: number;
  deltaVal: number;
} {
  if (poly.length < 3 || owners.length === 0) {
    return { partitions: [], dividers: [], isVertical: true, minVal: 0, deltaVal: 1 };
  }
  if (owners.length === 1) {
    return {
      partitions: [{ owner: owners[0], subPoly: poly, color: OWNER_PALETTE[0] }],
      dividers: [],
      isVertical: true,
      minVal: 0,
      deltaVal: 1
    };
  }

  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const deltaLat = maxLat - minLat;
  const deltaLng = maxLng - minLng;
  const isVertical = orientation === 'vertical' ? true : (orientation === 'horizontal' ? false : deltaLng >= deltaLat);

  const minVal = isVertical ? minLng : minLat;
  const deltaVal = (isVertical ? deltaLng : deltaLat) || 0.00001;

  const totalAcres = owners.reduce((s, o) => s + (Number(o.shareAcres) || 1), 0) || 1;
  const partitions: Array<{ owner: CoOwnerPartition; subPoly: LatLng[]; color: string }> = [];
  const dividers: SeparationDivider[] = [];

  let accumulatedFrac = 0;
  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    const frac = (Number(owner.shareAcres) || 1) / totalAcres;
    const startFrac = accumulatedFrac;
    const endFrac = i === owners.length - 1 ? 1 : Math.min(1, accumulatedFrac + frac);
    accumulatedFrac = endFrac;

    let sub: LatLng[] = [];
    if (isVertical) {
      const vMin = minLng + startFrac * deltaLng;
      const vMax = minLng + endFrac * deltaLng;
      const step1 = clipHalfPlane(poly, (p) => p.lng >= vMin, (p1, p2) => {
        const denom = (p2.lng - p1.lng) || 0.0000001;
        const t = (vMin - p1.lng) / denom;
        return { lat: p1.lat + t * (p2.lat - p1.lat), lng: vMin };
      });
      sub = clipHalfPlane(step1, (p) => p.lng <= vMax, (p1, p2) => {
        const denom = (p2.lng - p1.lng) || 0.0000001;
        const t = (vMax - p1.lng) / denom;
        return { lat: p1.lat + t * (p2.lat - p1.lat), lng: vMax };
      });
    } else {
      const vMin = minLat + startFrac * deltaLat;
      const vMax = minLat + endFrac * deltaLat;
      const step1 = clipHalfPlane(poly, (p) => p.lat >= vMin, (p1, p2) => {
        const denom = (p2.lat - p1.lat) || 0.0000001;
        const t = (vMin - p1.lat) / denom;
        return { lat: vMin, lng: p1.lng + t * (p2.lng - p1.lng) };
      });
      sub = clipHalfPlane(step1, (p) => p.lat <= vMax, (p1, p2) => {
        const denom = (p2.lat - p1.lat) || 0.0000001;
        const t = (vMax - p1.lat) / denom;
        return { lat: vMax, lng: p1.lng + t * (p2.lng - p1.lng) };
      });
    }

    if (sub.length >= 3) {
      partitions.push({
        owner,
        subPoly: sub,
        color: OWNER_PALETTE[i % OWNER_PALETTE.length]
      });
    }

    // Extract separation boundary line between owner i and owner i+1
    if (i < owners.length - 1) {
      const cutVal = isVertical ? (minLng + endFrac * deltaLng) : (minLat + endFrac * deltaLat);
      const edgePoints = findIntersectionWithEdges(poly, cutVal, isVertical);
      if (edgePoints.length >= 2) {
        const pStart = edgePoints[0];
        const pEnd = edgePoints[edgePoints.length - 1];
        dividers.push({
          id: `div-${i}-${i + 1}`,
          ownerIndexA: i,
          ownerIndexB: i + 1,
          ownerNameA: owner.name,
          ownerNameB: owners[i + 1].name,
          pStart,
          pEnd,
          mid: { lat: (pStart.lat + pEnd.lat) / 2, lng: (pStart.lng + pEnd.lng) / 2 },
          frac: endFrac,
          isVertical,
          minVal,
          deltaVal
        });
      }
    }
  }

  return { partitions, dividers, isVertical, minVal, deltaVal };
}

/** Recalculate co-owner shares when a separation divider fraction is dragged. */
export function calculateUpdatedShares(
  owners: CoOwnerPartition[],
  idxA: number,
  idxB: number,
  newFrac: number
): CoOwnerPartition[] {
  const total = owners.reduce((s, o) => s + (Number(o.shareAcres) || 0), 0) || 1;
  if (owners.length === 2) {
    const shareA = Number((total * newFrac).toFixed(2));
    const shareB = Number((total - shareA).toFixed(2));
    return [
      { ...owners[0], shareAcres: shareA, percentage: Number((newFrac * 100).toFixed(1)) },
      { ...owners[1], shareAcres: shareB, percentage: Number(((1 - newFrac) * 100).toFixed(1)) }
    ];
  }

  // Multi-owner proportional shift between adjacent shares
  const shares = owners.map((o) => Number(o.shareAcres) || 0);
  const fracArray = shares.map((s) => s / total);

  let cumBefore = 0;
  for (let i = 0; i < idxA; i++) cumBefore += fracArray[i];

  let cumAfter = 0;
  for (let i = idxB + 1; i < owners.length; i++) cumAfter += fracArray[i];

  const minAllowed = cumBefore + 0.04;
  const maxAllowed = 1 - cumAfter - 0.04;
  const clampedFrac = Math.max(minAllowed, Math.min(maxAllowed, newFrac));

  const newFracA = clampedFrac - cumBefore;
  const newFracB = (1 - cumAfter) - clampedFrac;

  return owners.map((o, i) => {
    if (i === idxA) {
      const share = Number((total * newFracA).toFixed(2));
      return { ...o, shareAcres: share, percentage: Number((newFracA * 100).toFixed(1)) };
    }
    if (i === idxB) {
      const share = Number((total * newFracB).toFixed(2));
      return { ...o, shareAcres: share, percentage: Number((newFracB * 100).toFixed(1)) };
    }
    return o;
  });
}

// ── NDVI helpers ───────────────────────────────────────────────────────────────

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

function syntheticNdvi(lat: number, lng: number): number {
  const x = lat * 9500;
  const y = lng * 9500;
  const base =
    0.30 * Math.sin(x * 1.27 + y * 0.83) +
    0.18 * Math.sin(x * 3.11 - y * 2.07) +
    0.10 * Math.sin(x * 6.37 + y * 5.19) +
    0.06 * Math.sin(x * 12.5 - y * 9.73) +
    0.04 * Math.sin(x * 24.1 + y * 19.4);
  return Math.max(0.05, Math.min(0.95, 0.58 + base * 0.65));
}

function ndviColor(v: number): [number, number, number, number] {
  if (v < 0.1)  return [139, 69,  19, 200];
  if (v < 0.2)  return [210, 120, 40, 200];
  if (v < 0.3)  return [240, 190, 50, 200];
  if (v < 0.45) return [195, 220, 55, 200];
  if (v < 0.6)  return [120, 195, 55, 200];
  if (v < 0.75) return [50,  160, 40, 200];
  if (v < 0.85) return [20,  110, 25, 200];
  return [5, 70, 10, 200];
}

function buildNdviCanvas(poly: LatLng[]): string {
  const lats = poly.map((p) => p.lat);
  const lngs = poly.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const RES = 280;
  const canvas = document.createElement('canvas');
  canvas.width = RES;
  canvas.height = RES;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(RES, RES);

  for (let py = 0; py < RES; py++) {
    for (let px = 0; px < RES; px++) {
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

// ── Icons ──────────────────────────────────────────────────────────────────────

const makeVertexIcon = (idx: number) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#10b981;border:2.5px solid #ffffff;color:#ffffff;font-size:10px;font-weight:800;box-shadow:0 0 0 2px #059669,0 3px 8px rgba(0,0,0,0.5);cursor:grab;user-select:none;">${idx + 1}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

// ── Component ──────────────────────────────────────────────────────────────────

export const FarmMapEditor: React.FC<FarmMapEditorProps> = ({
  center = { lat: 20.5937, lng: 78.9629 },
  initialPolygon,
  onChange,
  height = 420,
  readOnly = false,
  showNdvi = false,
  coOwners,
  gatNumber,
  splitOrientation = 'auto',
  onCoOwnersChange,
  onSplitOrientationChange
}) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const mapReadyRef     = useRef(false);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const subPlotsLayerRef = useRef<L.LayerGroup | null>(null);
  const dividersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef      = useRef<L.Marker[]>([]);
  const ndviLayerRef    = useRef<L.ImageOverlay | null>(null);

  const onChangeRef     = useRef(onChange);
  onChangeRef.current   = onChange;

  const onCoOwnersChangeRef = useRef(onCoOwnersChange);
  onCoOwnersChangeRef.current = onCoOwnersChange;

  const currentOwnersRef = useRef<CoOwnerPartition[]>(coOwners || []);
  const splitOrientationRef = useRef<'auto' | 'horizontal' | 'vertical'>(splitOrientation);

  const pointsRef = useRef<LatLng[]>(initialPolygon ?? []);
  const [points, setPoints] = useState<LatLng[]>(initialPolygon ?? []);
  const [locating, setLocating] = useState(false);

  // Synchronize owners when passed from outside (e.g. from slider)
  useEffect(() => {
    if (coOwners) {
      currentOwnersRef.current = coOwners;
      if (mapRef.current && mapReadyRef.current) {
        drawPolygon(pointsRef.current, mapRef.current);
      }
    }
  }, [coOwners]);

  useEffect(() => {
    splitOrientationRef.current = splitOrientation;
    if (mapRef.current && mapReadyRef.current) {
      drawPolygon(pointsRef.current, mapRef.current);
    }
  }, [splitOrientation]);

  // ── Draw helpers ─────────────────────────────────────────────────────────────

  const drawPolygon = useCallback((pts: LatLng[], map: L.Map) => {
    polygonLayerRef.current?.remove();
    polygonLayerRef.current = null;
    subPlotsLayerRef.current?.remove();
    subPlotsLayerRef.current = null;
    dividersLayerRef.current?.remove();
    dividersLayerRef.current = null;

    if (pts.length >= 3) {
      // 1. Draw overall farm boundary outline
      polygonLayerRef.current = L.polygon(
        pts.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: (currentOwnersRef.current && currentOwnersRef.current.length > 0) ? 0.04 : 0.18,
          weight: 2.8,
          dashArray: readOnly ? undefined : '6 4'
        }
      ).addTo(map);

      // 2. If 7/12 Co-Owners exist, partition sub-plots and draw adjustable separation boundaries
      const owners = currentOwnersRef.current;
      if (owners && owners.length > 0) {
        const { partitions, dividers, isVertical } = partitionPolygonByShares(
          pts,
          owners,
          splitOrientationRef.current
        );

        const subPlotsGroup = L.layerGroup();
        const totalAcres = owners.reduce((s, o) => s + (Number(o.shareAcres) || 1), 0) || 1;

        // Draw each co-owner sub-plot polygon
        partitions.forEach((item) => {
          const subPolyLayer = L.polygon(
            item.subPoly.map((p) => [p.lat, p.lng] as [number, number]),
            {
              color: item.color,
              fillColor: item.color,
              fillOpacity: 0.36,
              weight: 2.2
            }
          );

          const sharePct = ((Number(item.owner.shareAcres) / totalAcres) * 100).toFixed(1);

          subPolyLayer.bindTooltip(
            `<div style="font-size: 12px; font-weight: 600;">👤 ${item.owner.name} (${item.owner.relationship || 'Co-Owner'})<br/><span style="color: ${item.color}; font-weight: 700;">${item.owner.shareAcres} Acres (${sharePct}%)</span></div>`,
            { sticky: true }
          );

          subPolyLayer.bindPopup(`
            <div style="font-family: inherit; font-size: 13px; line-height: 1.5; color: #0f172a; padding: 4px; min-width: 210px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${item.color}; padding-bottom: 6px; margin-bottom: 8px;">
                <strong style="font-size: 14px; color: ${item.color};">${item.owner.name}</strong>
                ${item.owner.isManagingCultivator ? '<span style="background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">★ Cultivator</span>' : ''}
              </div>
              <div style="margin-bottom: 3px;"><strong>Relationship:</strong> ${item.owner.relationship || 'Co-Owner'}</div>
              <div style="margin-bottom: 3px;"><strong>Land Share:</strong> ${item.owner.shareAcres} Acres (${sharePct}%)</div>
              ${item.owner.surveyHissaNo ? `<div style="margin-bottom: 3px;"><strong>7/12 Hissa No:</strong> ${item.owner.surveyHissaNo}</div>` : ''}
              ${gatNumber ? `<div style="margin-bottom: 3px;"><strong>Gat / Survey:</strong> ${gatNumber}</div>` : ''}
              ${item.owner.assignedCrop ? `<div style="margin-top: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 8px; border-radius: 4px; color: #15803d; font-weight: 600;">🌱 Assigned Crop: ${item.owner.assignedCrop}</div>` : ''}
            </div>
          `);

          subPolyLayer.addTo(subPlotsGroup);

          // Centroid badge
          const centroid = computeCentroid(item.subPoly);
          const badgeIcon = L.divIcon({
            className: '',
            html: `<div style="background: rgba(15, 23, 42, 0.90); color: #fff; border: 1.5px solid ${item.color}; border-radius: 6px; padding: 2px 7px; font-size: 11px; font-weight: 700; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.5); text-align: center; transform: translate(-50%, -50%);">
              ${item.owner.name.split(' ')[0]} • ${item.owner.shareAcres} Ac
            </div>`,
            iconSize: [0, 0]
          });
          L.marker([centroid.lat, centroid.lng], { icon: badgeIcon, interactive: false }).addTo(subPlotsGroup);
        });

        subPlotsGroup.addTo(map);
        subPlotsLayerRef.current = subPlotsGroup;

        // 3. Draw separation boundaries and interactive partition handles
        const dividersGroup = L.layerGroup();
        dividers.forEach((d) => {
          // Double polyline for clear cadastral line demarcation
          const outlinePolyline = L.polyline(
            [[d.pStart.lat, d.pStart.lng], [d.pEnd.lat, d.pEnd.lng]],
            { color: '#0284c7', weight: 5.5, opacity: 0.85 }
          );
          const corePolyline = L.polyline(
            [[d.pStart.lat, d.pStart.lng], [d.pEnd.lat, d.pEnd.lng]],
            { color: '#ffffff', weight: 3, dashArray: '6 4', opacity: 1 }
          );

          outlinePolyline.addTo(dividersGroup);
          corePolyline.addTo(dividersGroup);

          // Interactive Draggable Separation Boundary Handle
          if (!readOnly) {
            const handleIcon = L.divIcon({
              className: '',
              html: `
                <div style="display:inline-flex;align-items:center;gap:5px;background:#0284c7;color:#ffffff;border:2px solid #ffffff;border-radius:18px;padding:3px 10px;font-size:11px;font-weight:700;box-shadow:0 3px 10px rgba(0,0,0,0.45);cursor:${d.isVertical ? 'ew-resize' : 'ns-resize'};transform:translate(-50%, -50%);user-select:none;white-space:nowrap;">
                  <span>${d.isVertical ? '↔' : '↕'} Move Boundary</span>
                </div>
              `,
              iconSize: [0, 0]
            });

            const handleMarker = L.marker([d.mid.lat, d.mid.lng], {
              icon: handleIcon,
              draggable: true
            });

            handleMarker.bindTooltip(
              `Drag to adjust boundary between <strong>${d.ownerNameA}</strong> and <strong>${d.ownerNameB}</strong>`,
              { direction: 'top', offset: [0, -12] }
            );

            handleMarker.on('drag', (e: L.LeafletEvent) => {
              const marker = e.target as L.Marker;
              const pos = marker.getLatLng();
              const rawVal = d.isVertical ? pos.lng : pos.lat;
              let newFrac = (rawVal - d.minVal) / (d.deltaVal || 0.000001);
              newFrac = Math.max(0.06, Math.min(0.94, newFrac));

              const updatedOwners = calculateUpdatedShares(
                currentOwnersRef.current,
                d.ownerIndexA,
                d.ownerIndexB,
                newFrac
              );
              currentOwnersRef.current = updatedOwners;
              onCoOwnersChangeRef.current?.(updatedOwners);
              drawPolygon(pointsRef.current, map);
            });

            handleMarker.on('dragend', () => {
              onCoOwnersChangeRef.current?.(currentOwnersRef.current);
              drawPolygon(pointsRef.current, map);
            });

            handleMarker.addTo(dividersGroup);
          }
        });

        dividersGroup.addTo(map);
        dividersLayerRef.current = dividersGroup;
      }
    }
  }, [readOnly, gatNumber]);

  // ── Draw Outer Boundary Vertex Markers ───────────────────────────────────────

  const drawMarkers = useCallback((pts: LatLng[], map: L.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (readOnly) return;

    pts.forEach((pt, idx) => {
      const marker = L.marker([pt.lat, pt.lng], {
        icon: makeVertexIcon(idx),
        draggable: true
      }).addTo(map);

      marker.bindTooltip(
        `Corner #${idx + 1} (Overall Boundary)<br/><span style="color:#a7f3d0;font-size:10px;">Drag to adjust • Right-click to remove</span>`,
        { direction: 'top', offset: [0, -12] }
      );

      marker.on('drag', () => {
        const { lat, lng } = marker.getLatLng();
        const updated = pointsRef.current.map((p, i) => (i === idx ? { lat, lng } : p));
        pointsRef.current = updated;

        // When outer boundary vertices are dragged, proportionally scale co-owners' shareAcres to new acreage
        const newTotalAcres = computePolygonAreaAcres(updated);
        if (newTotalAcres > 0 && currentOwnersRef.current && currentOwnersRef.current.length > 0) {
          const prevTotal = currentOwnersRef.current.reduce((s, o) => s + (Number(o.shareAcres) || 0), 0) || 1;
          const scaledOwners = currentOwnersRef.current.map((o) => {
            const frac = (Number(o.shareAcres) || 1) / prevTotal;
            return {
              ...o,
              shareAcres: Number((newTotalAcres * frac).toFixed(2)),
              percentage: Number((frac * 100).toFixed(1))
            };
          });
          currentOwnersRef.current = scaledOwners;
          onCoOwnersChangeRef.current?.(scaledOwners);
        }

        drawPolygon(updated, map);
        onChangeRef.current?.(updated, buildGeoJSON(updated));
      });

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        const updated = pointsRef.current.map((p, i) => (i === idx ? { lat, lng } : p));
        pointsRef.current = updated;
        setPoints([...updated]);
        onChangeRef.current?.(updated, buildGeoJSON(updated));
      });

      marker.on('contextmenu', () => {
        const updated = pointsRef.current.filter((_, i) => i !== idx);
        pointsRef.current = updated;
        setPoints([...updated]);
      });

      markersRef.current.push(marker);
    });
  }, [readOnly, drawPolygon]);

  // ── NDVI overlay ─────────────────────────────────────────────────────────────

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
  const currentArea = hasPolygon ? computePolygonAreaAcres(points) : 0;
  const hasMultipleOwners = currentOwnersRef.current && currentOwnersRef.current.length > 1;

  const instructionText =
    readOnly
      ? '🗺️ Farm boundary (read-only) — switch to 🛰️ Satellite View for aerial photo'
      : points.length === 0
      ? '📍 Click anywhere on the map to mark the first corner of your farm'
      : points.length < 3
      ? `📍 Keep clicking to add more corners (${points.length}/3 minimum so far)`
      : hasMultipleOwners
      ? `✏️ Drag 🟢 numbered dots for overall boundary • Drag [↔ Move Boundary] handle to adjust co-owner separation`
      : `✅ ${points.length} corners set — drag 🟢 numbered dots to adjust, right-click to remove`;

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
            Area: <strong style={{ color: '#34d399' }}>{currentArea} Ac</strong> • Centroid: {c.lat.toFixed(5)}°N, {c.lng.toFixed(5)}°E
          </span>
        )}
      </div>

      {/* Edit toolbar */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* Dividing direction selector if multiple owners exist */}
          {hasMultipleOwners && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dividing Axis:</span>
              <button
                type="button"
                onClick={() => {
                  splitOrientationRef.current = 'vertical';
                  onSplitOrientationChange?.('vertical');
                  if (mapRef.current) drawPolygon(pointsRef.current, mapRef.current);
                }}
                style={{
                  ...tbBtn,
                  background: splitOrientationRef.current === 'vertical' ? '#0284c7' : undefined,
                  color: splitOrientationRef.current === 'vertical' ? '#fff' : undefined,
                  borderColor: splitOrientationRef.current === 'vertical' ? '#0284c7' : undefined
                }}
              >
                ↔️ East-West
              </button>
              <button
                type="button"
                onClick={() => {
                  splitOrientationRef.current = 'horizontal';
                  onSplitOrientationChange?.('horizontal');
                  if (mapRef.current) drawPolygon(pointsRef.current, mapRef.current);
                }}
                style={{
                  ...tbBtn,
                  background: splitOrientationRef.current === 'horizontal' ? '#0284c7' : undefined,
                  color: splitOrientationRef.current === 'horizontal' ? '#fff' : undefined,
                  borderColor: splitOrientationRef.current === 'horizontal' ? '#0284c7' : undefined
                }}
              >
                ↕️ North-South
              </button>
            </div>
          )}
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
          💡 <strong>Overall Boundary:</strong> Drag the numbered 🟢 dots to adjust corners (or right-click a dot to delete).{' '}
          {hasMultipleOwners && (
            <>
              <strong>Separation Boundary:</strong> Drag the blue <strong>[↔ Move Boundary]</strong> handle on the dividing line to shift land shares between co-owners.{' '}
            </>
          )}
          Switch to <strong>🛰️ Satellite View</strong> (top-right) for cadastral aerial mapping.
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
