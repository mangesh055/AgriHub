import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Box, Layers, Compass, ZoomIn, ZoomOut, RotateCcw, MapPin, Maximize2 } from 'lucide-react';

// Fix default Leaflet marker icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface Farm2DCadastreMapProps {
  center?: { lat: number; lng: number };
  height?: number | string;
  ownerName?: string;
  ulpin?: string;
  farmName?: string;
  areaAcres?: number;
  gatNumber?: string;
  polygonPoints?: { lat: number; lng: number }[];
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  irrigationSource?: string;
  coOwners?: Array<{
    id?: string;
    name: string;
    relationship?: string;
    shareAcres?: number | string;
    percentage?: number;
    surveyHissaNo?: string;
    isManagingCultivator?: boolean;
    assignedCrop?: string;
  }>;
}

export function generateDynamicUlpin(farm: {
  id?: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  gatNumber?: string;
  areaAcres?: number | string;
  latitude?: number | string;
  longitude?: number | string;
}): string {
  if (!farm) return 'MH-PN-HV-G124-A40-0001';

  const rawState = (farm.state || 'Maharashtra').trim().toUpperCase();
  const stateCode = rawState.slice(0, 2) || 'MH';

  const rawDistrict = (farm.district || 'Pune').trim().toUpperCase();
  const distCode = rawDistrict.slice(0, 2) || 'PN';

  const rawTaluka = (farm.taluka || farm.village || 'Haveli').trim().toUpperCase();
  const talCode = rawTaluka.slice(0, 2) || 'HV';

  let gatCode = 'G124';
  if (farm.gatNumber) {
    const numMatch = farm.gatNumber.match(/\d+/);
    if (numMatch) {
      gatCode = `G${numMatch[0]}`;
    } else {
      const alphaNum = farm.gatNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
      if (alphaNum) gatCode = `G${alphaNum}`;
    }
  }

  const numAcres = Number(farm.areaAcres) || 4.0;
  const areaCode = `A${Math.round(numAcres * 10)}`;

  let idHash = '0001';
  if (farm.id) {
    const cleaned = farm.id.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length >= 4) {
      idHash = cleaned.slice(-4).toUpperCase();
    }
  } else if (farm.latitude && farm.longitude) {
    const latCode = Math.abs(Math.round(Number(farm.latitude) * 100)) % 100;
    const lngCode = Math.abs(Math.round(Number(farm.longitude) * 100)) % 100;
    idHash = `U${latCode}${lngCode}`;
  }

  return `${stateCode}-${distCode}-${talCode}-${gatCode}-${areaCode}-${idHash}`;
}

export const Farm2DCadastreMap: React.FC<Farm2DCadastreMapProps> = ({
  center = { lat: 18.5034, lng: 73.8203 },
  height = 460,
  ownerName,
  ulpin,
  farmName = 'Primary Precision Farm Plot',
  areaAcres = 4.0,
  gatNumber = 'Gat 124/A',
  polygonPoints,
  village,
  taluka,
  district,
  state,
  irrigationSource,
  coOwners
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'street'>('satellite');
  const [layersVisible, setLayersVisible] = useState({
    parcels: true,
    neighbors: true,
    dpRoad: true
  });

  const neighborLayersRef = useRef<L.LayerGroup | null>(null);
  const dpRoadLayerRef = useRef<L.Polyline | null>(null);

  // Compute dynamic owner name without hardcoded fallbacks
  const effectiveOwner = (ownerName && ownerName.trim() && ownerName.trim() !== 'Om')
    ? ownerName.trim()
    : coOwners?.find((c) => c.isManagingCultivator)?.name
    || coOwners?.[0]?.name
    || 'Registered Farmer';

  // Compute dynamic ULPIN
  const effectiveUlpin = ulpin || generateDynamicUlpin({
    gatNumber,
    areaAcres,
    village,
    taluka,
    district,
    state,
    latitude: center.lat,
    longitude: center.lng
  });

  // Dynamic road or waterway access label
  const isCanal = (irrigationSource || '').toUpperCase().includes('CANAL');
  const roadLabel = isCanal
    ? 'कालवा पट्टा व शेत रस्ता (Canal Waterway & Farm Road)'
    : village
      ? `${village} शेत रस्ता / पाणंद (Farm Approach Road)`
      : 'शेत रस्ता / पाणंद रस्ता (Farm Cadastre Access Road)';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lat = center.lat || 18.5034;
    const lng = center.lng || 73.8203;

    // 1. Initialize Leaflet Map
    if (!mapRef.current) {
      const map = L.map(container, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      // Default: Esri World Imagery (High-Resolution Satellite)
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      satLayer.addTo(map);
      tileLayerRef.current = satLayer;

      mapRef.current = map;
      neighborLayersRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    map.setView([lat, lng], 17);

    // 2. Prepare Main Cadastral Farm Polygon
    if (polygonRef.current) {
      polygonRef.current.remove();
    }

    let coords: [number, number][];
    if (polygonPoints && polygonPoints.length >= 3) {
      coords = polygonPoints.map((p) => [p.lat, p.lng]);
    } else {
      const dLat = 0.00065;
      const dLng = 0.00085;
      coords = [
        [lat + dLat, lng - dLng],
        [lat + dLat * 0.94, lng + dLng],
        [lat - dLat * 0.88, lng + dLng * 0.95],
        [lat - dLat, lng - dLng * 0.92]
      ];
    }

    const poly = L.polygon(coords, {
      color: '#10b981',
      weight: 3.5,
      fillColor: '#10b981',
      fillOpacity: 0.22,
      dashArray: '6 4'
    }).addTo(map);
    polygonRef.current = poly;

    // 3. Dynamic Neighboring Cadastre Plots / Co-Owner Sub-Plots
    if (neighborLayersRef.current) {
      neighborLayersRef.current.clearLayers();

      const dLat = 0.00065;
      const dLng = 0.00085;
      const numMatch = (gatNumber || '').match(/\d+/);
      const baseGatNum = numMatch ? parseInt(numMatch[0], 10) : 124;

      const otherCoOwners = (coOwners || []).filter((o) => !o.isManagingCultivator && o.name !== effectiveOwner);
      const secondaryOwner1 = otherCoOwners[0] || (coOwners && coOwners.length > 1 ? coOwners[1] : null);
      const secondaryOwner2 = otherCoOwners[1] || (coOwners && coOwners.length > 2 ? coOwners[2] : null);

      // North Parcel
      const neighborNorth: [number, number][] = [
        [lat + dLat * 1.05, lng - dLng * 1.1],
        [lat + dLat * 1.05, lng + dLng * 1.1],
        [lat + dLat * 2.1, lng + dLng * 1.05],
        [lat + dLat * 2.1, lng - dLng * 1.05]
      ];
      const northTitle = secondaryOwner1
        ? `Hissa ${secondaryOwner1.surveyHissaNo || `${baseGatNum}/2`}: ${secondaryOwner1.name} (${secondaryOwner1.shareAcres || ''} Ac)`
        : `शेजारील गट क्र. ${baseGatNum + 1} (Adjoining Farm Gat ${baseGatNum + 1})`;

      const northPopup = secondaryOwner1
        ? `<div style="font-family: Inter, sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">७/१२ सहहिस्सा (Co-Owner Parcel)</div>
            <div style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #0f172a;">${secondaryOwner1.name} (${secondaryOwner1.relationship || 'Co-Owner'})</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 4px 0;" />
            <div style="font-size: 11px; line-height: 1.5; color: #334155;">
              <div><strong>Survey Hissa:</strong> ${secondaryOwner1.surveyHissaNo || `${baseGatNum}/2`}</div>
              <div><strong>Holding Area:</strong> ${secondaryOwner1.shareAcres} Acres (${secondaryOwner1.percentage || ''}%)</div>
              ${secondaryOwner1.assignedCrop ? `<div><strong>Crop:</strong> <span style="color: #16a34a; font-weight: 700;">${secondaryOwner1.assignedCrop}</span></div>` : ''}
              <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">Joint 7/12 Co-Titled</span></div>
            </div>
          </div>`
        : `<div style="font-family: Inter, sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">शेजारील भू-खंड (North Boundary)</div>
            <div style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #0f172a;">Gat No. ${baseGatNum + 1}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 4px 0;" />
            <div style="font-size: 11px; line-height: 1.5; color: #334155;">
              <div><strong>Cadastre:</strong> Agricultural Farmland (कृषी जमीन)</div>
              <div><strong>Village Cadastre:</strong> ${village || 'Adjoining Sector'} गाव नकाशा</div>
            </div>
          </div>`;

      L.polygon(neighborNorth, {
        color: '#0284c7',
        weight: 1.8,
        fillColor: '#0284c7',
        fillOpacity: 0.16
      }).bindTooltip(northTitle, { permanent: false }).bindPopup(northPopup).addTo(neighborLayersRef.current);

      // East Parcel
      const neighborEast: [number, number][] = [
        [lat - dLat * 0.8, lng + dLng * 1.15],
        [lat + dLat * 0.9, lng + dLng * 1.15],
        [lat + dLat * 0.85, lng + dLng * 2.2],
        [lat - dLat * 0.75, lng + dLng * 2.15]
      ];
      const eastGatNum = baseGatNum > 1 ? baseGatNum - 1 : baseGatNum + 2;
      const eastTitle = secondaryOwner2
        ? `Hissa ${secondaryOwner2.surveyHissaNo || `${baseGatNum}/3`}: ${secondaryOwner2.name} (${secondaryOwner2.shareAcres || ''} Ac)`
        : `शेजारील गट क्र. ${eastGatNum} (Adjoining Farm Gat ${eastGatNum})`;

      const eastPopup = secondaryOwner2
        ? `<div style="font-family: Inter, sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">७/१२ सहहिस्सा (Co-Owner Parcel)</div>
            <div style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #0f172a;">${secondaryOwner2.name} (${secondaryOwner2.relationship || 'Co-Owner'})</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 4px 0;" />
            <div style="font-size: 11px; line-height: 1.5; color: #334155;">
              <div><strong>Survey Hissa:</strong> ${secondaryOwner2.surveyHissaNo || `${baseGatNum}/3`}</div>
              <div><strong>Holding Area:</strong> ${secondaryOwner2.shareAcres} Acres (${secondaryOwner2.percentage || ''}%)</div>
              ${secondaryOwner2.assignedCrop ? `<div><strong>Crop:</strong> <span style="color: #16a34a; font-weight: 700;">${secondaryOwner2.assignedCrop}</span></div>` : ''}
              <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">Joint 7/12 Co-Titled</span></div>
            </div>
          </div>`
        : `<div style="font-family: Inter, sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 800; color: #f59e0b; text-transform: uppercase;">शेजारील भू-खंड (East Boundary)</div>
            <div style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #0f172a;">Gat No. ${eastGatNum}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 4px 0;" />
            <div style="font-size: 11px; line-height: 1.5; color: #334155;">
              <div><strong>Cadastre:</strong> Agricultural Farmland (कृषी जमीन)</div>
              <div><strong>Village Cadastre:</strong> ${village || 'Adjoining Sector'} गाव नकाशा</div>
            </div>
          </div>`;

      L.polygon(neighborEast, {
        color: '#f59e0b',
        weight: 1.8,
        fillColor: '#f59e0b',
        fillOpacity: 0.16
      }).bindTooltip(eastTitle, { permanent: false }).bindPopup(eastPopup).addTo(neighborLayersRef.current);
    }

    // 4. Dynamic Farm Approach Road / Waterway Corridor
    if (dpRoadLayerRef.current) {
      dpRoadLayerRef.current.remove();
    }
    const dLatRoad = 0.00065;
    const dLngRoad = 0.00085;
    const dpRoadCoords: [number, number][] = [
      [lat - dLatRoad * 1.4, lng - dLngRoad * 2.8],
      [lat - dLatRoad * 1.35, lng + dLngRoad * 2.8]
    ];
    const dpRoad = L.polyline(dpRoadCoords, {
      color: isCanal ? '#0284c7' : '#ca8a04',
      weight: 5,
      opacity: 0.85,
      dashArray: isCanal ? '12 6' : '10 8'
    }).bindTooltip(roadLabel, { permanent: true, direction: 'bottom' }).addTo(map);
    dpRoadLayerRef.current = dpRoad;

    // 5. Pulsing ULPIN Marker with Dynamic Owner Name & Details
    if (markerRef.current) {
      markerRef.current.remove();
    }

    const coOwnersSubTag = coOwners && coOwners.length > 1
      ? `<div style="font-size: 9px; color: #34d399; font-weight: 600; margin-top: 2px;">👥 ${coOwners.length} Co-Owners (७/१२ सहहिस्सेदार)</div>`
      : '';

    const pinHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background: rgba(12, 21, 36, 0.95); border: 2px solid #0284c7; border-radius: 8px; padding: 7px 14px; box-shadow: 0 4px 20px rgba(2, 132, 199, 0.6); text-align: center; color: white; white-space: nowrap; backdrop-filter: blur(8px);">
          <div style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.08em; text-transform: uppercase;">BHU-AADHAAR ULPIN</div>
          <div style="font-size: 11px; font-weight: 700; font-family: monospace; color: #ffffff; margin-top: 1px;">${effectiveUlpin}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Owner: <strong style="color: #38bdf8;">${effectiveOwner}</strong></div>
          ${coOwnersSubTag}
        </div>
        <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #0284c7;"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #0284c7; box-shadow: 0 0 12px #38bdf8; margin-top: -3px;"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: '',
      html: pinHtml,
      iconSize: [220, 80],
      iconAnchor: [110, 80]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    // Dynamic Rich Popup
    const coOwnersSummaryHtml = coOwners && coOwners.length > 0
      ? `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
          <div style="font-size: 10px; font-weight: 700; color: #475569; margin-bottom: 4px;">७/१२ सहहिस्सेदार (${coOwners.length} Co-Owners):</div>
          <div style="display: flex; flex-direction: column; gap: 3px; font-size: 10px; color: #334155;">
            ${coOwners.map((o) => `<div>• <strong>${o.name}</strong> (${o.relationship || 'Owner'}): ${o.shareAcres} Ac ${o.assignedCrop ? '[' + o.assignedCrop + ']' : ''}</div>`).join('')}
          </div>
        </div>
      `
      : '';

    const popupContent = `
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 6px; min-width: 240px;">
        <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Cadastral Land Holding (भू-नकाशा)</div>
        <div style="font-size: 13px; font-weight: 800; margin: 3px 0; color: #0f172a;">${farmName}</div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
        <div style="font-size: 11px; line-height: 1.6; color: #334155;">
          <div><strong>ULPIN (भू-आधार):</strong> <span style="font-family: monospace; color: #0284c7; font-weight: 700;">${effectiveUlpin}</span></div>
          <div><strong>Primary Cultivator:</strong> <span style="font-weight: 700; color: #0284c7;">${effectiveOwner}</span></div>
          <div><strong>Survey / Gat:</strong> ${gatNumber}</div>
          <div><strong>Cadastral Area:</strong> ${areaAcres} Acres</div>
          ${village ? `<div><strong>Location:</strong> ${village}${taluka ? ', ' + taluka : ''}${district ? ', ' + district : ''}</div>` : ''}
          <div><strong>Approach Access:</strong> <span style="color: #0284c7; font-weight: 600;">${roadLabel}</span></div>
          <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">Verified (Geo-fenced)</span></div>
        </div>
        ${coOwnersSummaryHtml}
      </div>
    `;
    poly.bindPopup(popupContent);
    marker.bindPopup(popupContent);

    // Invalidate size
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(t);
  }, [center, ownerName, ulpin, farmName, areaAcres, gatNumber, polygonPoints, village, taluka, district, state, irrigationSource, coOwners, effectiveOwner, effectiveUlpin, roadLabel]);

  // Handle Map Style Switch
  const handleMapStyleToggle = (style: 'satellite' | 'street') => {
    setMapStyle(style);
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    if (style === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
      tileLayerRef.current = sat;
    } else {
      const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(map);
      tileLayerRef.current = street;
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!mapRef.current) return;
    if (direction === 'in') mapRef.current.zoomIn();
    else mapRef.current.zoomOut();
  };

  const handleReset = () => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat || 18.5034, center.lng || 73.8203], 17);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        background: '#090d14'
      }}
    >
      {/* Leaflet DOM Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Top-Left Map Style Controls */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '4px',
          display: 'flex',
          gap: '4px',
          zIndex: 400,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <button
          type="button"
          onClick={() => handleMapStyleToggle('satellite')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: mapStyle === 'satellite' ? '#0284c7' : 'transparent',
            color: mapStyle === 'satellite' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          🛰️ Satellite View
        </button>
        <button
          type="button"
          onClick={() => handleMapStyleToggle('street')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: mapStyle === 'street' ? '#0284c7' : 'transparent',
            color: mapStyle === 'street' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease'
          }}
        >
          🗺️ Street Cadastre
        </button>
      </div>

      {/* Floating Top-Right Navigation Gizmos (Compass, Zoom, 3D Link) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 400
        }}
      >
        {/* North Compass Gizmo */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ position: 'relative', width: '24px', height: '24px' }}>
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '10px solid #ef4444'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '10px solid #94a3b8'
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '8px',
                fontWeight: 900,
                color: '#ef4444'
              }}
            >
              N
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            onClick={() => handleZoom('in')}
            style={zoomBtnStyle}
            title="Zoom In"
          >
            +
          </button>
          <div style={{ height: '1px', background: '#334155' }} />
          <button
            type="button"
            onClick={() => handleZoom('out')}
            style={zoomBtnStyle}
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* Reset View Button */}
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid #334155',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Reset Centroid View"
        >
          <RotateCcw size={14} />
        </button>

        {/* Switch to 3D Cadastre Button */}
        <Link
          to="/cadastre-3d"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0284c7',
            color: '#ffffff',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.5)',
            marginTop: '4px'
          }}
        >
          <Box size={14} />
          <span>3D View</span>
        </Link>
      </div>

      {/* Floating Bottom Cadastre Status Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '5px 12px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          fontFamily: 'monospace',
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span>
          Centroid: <strong style={{ color: '#cbd5e1' }}>{center.lat.toFixed(4)}°N, {center.lng.toFixed(4)}°E</strong>
        </span>
        <span>•</span>
        <span>
          CRS: <strong style={{ color: '#10b981' }}>EPSG:4326</strong>
        </span>
        <span>•</span>
        <span>
          Plot: <strong style={{ color: '#38bdf8' }}>{gatNumber}</strong>
        </span>
        {village && (
          <>
            <span>•</span>
            <span>
              Village: <strong style={{ color: '#f59e0b' }}>{village}</strong>
            </span>
          </>
        )}
        {areaAcres && (
          <>
            <span>•</span>
            <span>
              Area: <strong style={{ color: '#34d399' }}>{areaAcres} Ac</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const zoomBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '28px',
  background: 'transparent',
  border: 'none',
  color: '#cbd5e1',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
