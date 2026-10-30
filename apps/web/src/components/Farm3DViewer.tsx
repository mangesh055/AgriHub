import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Copy,
  Check,
  FileText,
  Download,
  AlertTriangle,
  Ruler,
  Maximize2,
  Share2,
  Printer,
  RotateCcw,
  Compass,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Info,
  MapPin,
  ShieldCheck,
  Box,
  Map as MapIcon,
  Eye,
  EyeOff,
  Navigation
} from 'lucide-react';

// Fix default Leaflet icon paths in Vite / Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Type definitions matching the 3D ULPIN & Vertical Cadastre specifications
export interface StratumLayer {
  id: string;
  name: string;
  subName?: string;
  level: number; // 0 is ground, negative is underground, positive is above ground
  owner: string;
  ownerColor: string; // hex
  ownerClass: 'A' | 'B' | 'C' | 'D' | 'Utility' | 'Common';
  unitNo: string;
  verticalRange: string;
  areaSqFt: number;
  areaAcres?: number;
  useType: string;
  status: 'Verified' | 'Pending' | 'Disputed';
  cropOrFeature?: string;
  depthOrHeight: string;
}

export interface ParcelData {
  ulpin: string;
  parcelId: string;
  gatNo: string;
  surveyNo: string;
  buildingId: string;
  propertyName: string;
  city: string;
  zone: string;
  sector: string;
  propertyType: string;
  ownershipType: string;
  ownerName: string;
  totalAreaSqFt: number;
  totalAreaAcres: number;
  verticalRange: string;
  status: 'Verified' | 'Pending' | 'In Review';
  registrationNo: string;
  registrationDate: string;
  coordinates: { lat: number; lng: number; elevation: number };
  accuracy: string;
  crs: string;
  strata: StratumLayer[];
}

// Default pre-seeded parcel data matching the exact screenshot & Indian Land Records
export const DEFAULT_PARCEL: ParcelData = {
  ulpin: 'MH-PN-KT-P125-B02-F05-U501',
  parcelId: 'P-125',
  gatNo: 'Gat 142/A',
  surveyNo: 'Survey 501/2',
  buildingId: 'B02',
  propertyName: 'Kothrud Agro-Cadastre Complex & Vertical Farm',
  city: 'Pune',
  zone: 'Kothrud',
  sector: 'P-125',
  propertyType: 'Agricultural & Agri-Tech Facility',
  ownershipType: 'Private Freehold',
  ownerName: 'Rahul Deshmukh',
  totalAreaSqFt: 842.5,
  totalAreaAcres: 4.85,
  verticalRange: '12.00 m - 15.00 m (Stratum Level 5)',
  status: 'Verified',
  registrationNo: 'PN/Kothrud/2024/12501',
  registrationDate: '14-Mar-2024',
  coordinates: {
    lat: 18.5034,
    lng: 73.8203,
    elevation: 560.45
  },
  accuracy: '0.03 m',
  crs: 'EPSG:4326',
  strata: [
    {
      id: 'terrace',
      name: 'Terrace',
      subName: 'Rooftop Solar & Hydroponic Greenhouse',
      level: 8,
      owner: 'Common Area',
      ownerColor: '#2e7d32',
      ownerClass: 'Common',
      unitNo: 'TR-01',
      verticalRange: '21.00 m - 24.00 m',
      areaSqFt: 920.0,
      useType: 'Common Hydroponics & Solar Array',
      status: 'Verified',
      cropOrFeature: 'Microgreens & Solar (40kW)',
      depthOrHeight: '+24.0m'
    },
    {
      id: 'floor-7',
      name: '7th Floor',
      subName: 'Aeroponic Seed Multiplication Lab',
      level: 7,
      owner: 'Owner A',
      ownerColor: '#2e7d32',
      ownerClass: 'A',
      unitNo: '701',
      verticalRange: '18.00 m - 21.00 m',
      areaSqFt: 842.5,
      useType: 'Controlled Climate Horticulture',
      status: 'Verified',
      cropOrFeature: 'Tissue Culture Strawberry',
      depthOrHeight: '+21.0m'
    },
    {
      id: 'floor-6',
      name: '6th Floor',
      subName: 'High-Density Strawberry Canopy',
      level: 6,
      owner: 'Owner A',
      ownerColor: '#2e7d32',
      ownerClass: 'A',
      unitNo: '601',
      verticalRange: '15.00 m - 18.00 m',
      areaSqFt: 842.5,
      useType: 'Vertical Berry Orchard',
      status: 'Verified',
      cropOrFeature: 'Sweet Charlie Strawberry',
      depthOrHeight: '+18.0m'
    },
    {
      id: 'floor-5',
      name: '5th Floor',
      subName: 'Precision Exotic Bell Pepper Unit',
      level: 5,
      owner: 'Owner B',
      ownerColor: '#1976d2',
      ownerClass: 'B',
      unitNo: '501',
      verticalRange: '12.00 m - 15.00 m',
      areaSqFt: 842.5,
      useType: 'Polyhouse Greenhouse Strata',
      status: 'Verified',
      cropOrFeature: 'Yellow & Red Bell Peppers',
      depthOrHeight: '+15.0m'
    },
    {
      id: 'floor-4',
      name: '4th Floor',
      subName: 'Hydroponic Leafy Greens Chamber',
      level: 4,
      owner: 'Owner B',
      ownerColor: '#1976d2',
      ownerClass: 'B',
      unitNo: '401',
      verticalRange: '9.00 m - 12.00 m',
      areaSqFt: 842.5,
      useType: 'NFT Hydroponics',
      status: 'Verified',
      cropOrFeature: 'Romaine Lettuce & Baby Spinach',
      depthOrHeight: '+12.0m'
    },
    {
      id: 'floor-3',
      name: '3rd Floor',
      subName: 'Precision Herbaceous Zone',
      level: 3,
      owner: 'Owner C',
      ownerColor: '#e65100',
      ownerClass: 'C',
      unitNo: '301',
      verticalRange: '6.00 m - 9.00 m',
      areaSqFt: 842.5,
      useType: 'Culinary Herbal Beds',
      status: 'Verified',
      cropOrFeature: 'Genovese Basil & Mint',
      depthOrHeight: '+9.0m'
    },
    {
      id: 'floor-2',
      name: '2nd Floor',
      subName: 'Mushroom & Fungiculture Deck',
      level: 2,
      owner: 'Owner C',
      ownerColor: '#e65100',
      ownerClass: 'C',
      unitNo: '201',
      verticalRange: '3.00 m - 6.00 m',
      areaSqFt: 842.5,
      useType: 'Darkroom Spore Substrate',
      status: 'Verified',
      cropOrFeature: 'Oyster & Button Mushrooms',
      depthOrHeight: '+6.0m'
    },
    {
      id: 'floor-1',
      name: '1st Floor',
      subName: 'Root Stock & Sapling Nursery',
      level: 1,
      owner: 'Owner C',
      ownerColor: '#e65100',
      ownerClass: 'C',
      unitNo: '101',
      verticalRange: '0.00 m - 3.00 m',
      areaSqFt: 842.5,
      useType: 'Propagation Chamber',
      status: 'Verified',
      cropOrFeature: 'Tomato Grafted Seedlings',
      depthOrHeight: '+3.0m'
    },
    {
      id: 'ground',
      name: 'Ground Floor',
      subName: 'Agri-Logistics & Direct Mandi Hub',
      level: 0,
      owner: 'Owner D (Commercial)',
      ownerColor: '#fbc02d',
      ownerClass: 'D',
      unitNo: 'G-01',
      verticalRange: '0.00 m - 3.00 m Ground Level',
      areaSqFt: 1150.0,
      useType: 'Cold Storage & Farmgate Packhouse',
      status: 'Verified',
      cropOrFeature: 'Grade-A Sorting / Automated Conveyor',
      depthOrHeight: '0.0m'
    },
    {
      id: 'basement-1',
      name: 'Basement 1',
      subName: 'Fertigation & Nutrient Reservoir Deck',
      level: -1,
      owner: 'Parking - Owner D',
      ownerColor: '#7b1fa2',
      ownerClass: 'D',
      unitNo: 'B1-04',
      verticalRange: '-3.50 m - 0.00 m',
      areaSqFt: 1200.0,
      useType: 'Automated Dosing Machinery & Tractors',
      status: 'Verified',
      cropOrFeature: '50,000L RO Nutrient Tanks',
      depthOrHeight: '-3.5m'
    },
    {
      id: 'basement-2',
      name: 'Basement 2',
      subName: 'Deep Aquifer & Geothermal Infiltration',
      level: -2,
      owner: 'Utility Area',
      ownerColor: '#6a1b9a',
      ownerClass: 'Utility',
      unitNo: 'UTIL-01',
      verticalRange: '-7.00 m - -3.50 m',
      areaSqFt: 1200.0,
      useType: 'Groundwater Borewell Recharge & Geo-Loop',
      status: 'Verified',
      cropOrFeature: 'Artesian Borewell Sensor Hub',
      depthOrHeight: '-7.0m'
    }
  ]
};

// Alternative agricultural farm parcels for live filtering
export const SAMPLE_PARCELS: Record<string, ParcelData> = {
  'MH-PN-KT-P125-B02-F05-U501': DEFAULT_PARCEL,
  'MH-PN-BR-G142-P01-F01-U101': {
    ...DEFAULT_PARCEL,
    ulpin: 'MH-PN-BR-G142-P01-F01-U101',
    parcelId: 'Gat 142/B',
    gatNo: 'Gat 142/B',
    surveyNo: 'Survey 214/1',
    propertyName: 'Baramati Sugarcane & Drip Precision Estate',
    city: 'Pune',
    zone: 'Baramati',
    sector: 'Zone-3',
    ownerName: 'Dattatray Patil',
    totalAreaAcres: 12.4,
    totalAreaSqFt: 540144,
    propertyType: 'Open Irrigated Farmland',
    status: 'Verified',
    registrationNo: 'PN/Baramati/2024/04882',
    coordinates: { lat: 18.1517, lng: 74.5771, elevation: 538.2 }
  },
  'MH-NS-ND-G088-P03-F02-U202': {
    ...DEFAULT_PARCEL,
    ulpin: 'MH-NS-ND-G088-P03-F02-U202',
    parcelId: 'Gat 88',
    gatNo: 'Gat 88',
    surveyNo: 'Survey 98/A',
    propertyName: 'Nashik Valley Export Grape Vineyard',
    city: 'Nashik',
    zone: 'Dindori',
    sector: 'Valley-9',
    ownerName: 'Sunita Gaikwad',
    totalAreaAcres: 8.75,
    totalAreaSqFt: 381150,
    propertyType: 'Vineyard & Polyhouse Agro-Estate',
    status: 'Verified',
    registrationNo: 'NS/Dindori/2024/09311',
    coordinates: { lat: 20.1981, lng: 73.8329, elevation: 610.15 }
  }
};

export interface Farm3DViewerProps {
  farm?: any;
  initialOwnerName?: string;
  initialFarmName?: string;
  initialGatNo?: string;
  initialUlpin?: string;
}

export const Farm3DViewer: React.FC<Farm3DViewerProps> = ({
  farm,
  initialOwnerName,
  initialFarmName,
  initialGatNo,
  initialUlpin
}) => {
  // Filters state
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [selectedZone, setSelectedZone] = useState('Kothrud');
  const [selectedSector, setSelectedSector] = useState('P-125');
  const [selectedPropType, setSelectedPropType] = useState('All');
  const [selectedOwnershipType, setSelectedOwnershipType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active View Mode: '2D' | '3D' | 'Underground'
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'Underground'>('3D');
  const [map2DStyle, setMap2DStyle] = useState<'satellite' | 'street' | 'ndvi'>('satellite');

  // Active Parcel & Stratum
  const [activeParcel, setActiveParcel] = useState<ParcelData>(DEFAULT_PARCEL);
  const [selectedStratumId, setSelectedStratumId] = useState<string>('floor-5');

  // Layer toggles matching screenshot bottom-left Map Layers box
  const [layers, setLayers] = useState({
    parcels: true,
    buildings: true,
    ownership: true,
    floors: true,
    undergroundUtility: true,
    roads: true,
    satelliteImagery: false
  });

  // Modals & Tools
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [copiedULPIN, setCopiedULPIN] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<string | null>(null);

  // Compass rotation angle in degrees
  const [compassAngle, setCompassAngle] = useState(0);

  // Cursor coordinates
  const [cursorCoords, setCursorCoords] = useState({
    lat: 18.5034,
    lng: 73.8203,
    elevation: 560.45
  });

  // 3D Canvas & Three.js Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groundMeshRef = useRef<THREE.Mesh | null>(null);
  const meshesByStratumId = useRef<Map<string, THREE.Mesh>>(new Map());
  const boundingCageRef = useRef<THREE.LineSegments | null>(null);

  // 2D Leaflet Refs
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletPolygonRef = useRef<L.Polygon | null>(null);
  const leafletMarkerRef = useRef<L.Marker | null>(null);
  const leafletTileLayerRef = useRef<L.TileLayer | null>(null);
  const leafletNdviOverlayRef = useRef<L.ImageOverlay | null>(null);

  // Floating 3D Tooltip Screen Position
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: true
  });

  // Active Stratum details
  const activeStratum = useMemo(() => {
    return (
      activeParcel.strata.find((s) => s.id === selectedStratumId) ||
      activeParcel.strata[3] // floor-5 default
    );
  }, [activeParcel, selectedStratumId]);

  // Handle dynamic farm data and owner overrides
  useEffect(() => {
    setActiveParcel((prev) => {
      const dynamicOwner = (initialOwnerName && initialOwnerName !== 'Rahul Deshmukh')
        ? initialOwnerName
        : (farm?.coOwners?.find((c: any) => c.isManagingCultivator)?.name || farm?.coOwners?.[0]?.name || farm?.farmerName || prev.ownerName);

      const dynamicName = initialFarmName || farm?.name || prev.propertyName;
      const dynamicGat = initialGatNo || farm?.gatNumber || prev.gatNo;
      const dynamicUlpin = initialUlpin || prev.ulpin;
      const dynamicAcres = farm?.areaAcres ? Number(farm.areaAcres) : prev.totalAreaAcres;
      const dynamicSqFt = dynamicAcres ? Math.round(dynamicAcres * 43560) : prev.totalAreaSqFt;
      const dynamicLat = farm?.latitude ? Number(farm.latitude) : prev.coordinates.lat;
      const dynamicLng = farm?.longitude ? Number(farm.longitude) : prev.coordinates.lng;
      const dynamicCity = farm?.district || farm?.taluka || prev.city;
      const dynamicZone = farm?.village || farm?.taluka || prev.zone;

      return {
        ...prev,
        ownerName: dynamicOwner,
        propertyName: dynamicName,
        gatNo: dynamicGat,
        ulpin: dynamicUlpin,
        totalAreaAcres: dynamicAcres,
        totalAreaSqFt: dynamicSqFt,
        city: dynamicCity,
        zone: dynamicZone,
        coordinates: {
          ...prev.coordinates,
          lat: dynamicLat,
          lng: dynamicLng
        }
      };
    });
  }, [farm, initialOwnerName, initialFarmName, initialGatNo, initialUlpin]);

  // Copy ULPIN to clipboard
  const handleCopyULPIN = () => {
    navigator.clipboard.writeText(activeParcel.ulpin);
    setCopiedULPIN(true);
    setTimeout(() => setCopiedULPIN(false), 2000);
  };

  // --------------------------------------------------------------------------
  // 1. THREE.JS 3D SCENE SETUP & RENDER LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0f141c);
    scene.fog = new THREE.FogExp2(0x0f141c, 0.012);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(28, 22, 28);
    camera.lookAt(0, 4, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe8f0fe, 1.4);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueGlow = new THREE.PointLight(0x0284c7, 1.2, 50);
    blueGlow.position.set(0, 12, 0);
    scene.add(blueGlow);

    // 5. Ground Plane with Orthophoto & Roads Texture
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1024;
    groundCanvas.height = 1024;
    const ctx = groundCanvas.getContext('2d')!;

    // Aerial cadastre background
    ctx.fillStyle = '#111722';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grid lines
    ctx.strokeStyle = '#1b2433';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1024; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Roads (DP Road and Sector Road)
    ctx.fillStyle = '#19202c';
    ctx.fillRect(100, 680, 824, 140); // DP Road
    ctx.save();
    ctx.translate(720, 200);
    ctx.rotate(0.45);
    ctx.fillRect(-60, 0, 120, 700); // Sector Road
    ctx.restore();

    // Road markings
    ctx.strokeStyle = '#293548';
    ctx.setLineDash([16, 16]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 750);
    ctx.lineTo(924, 750);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text markings on road
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('DP Road', 300, 758);
    ctx.fillText('Sector Road', 760, 480);

    // Agricultural plots boundaries
    ctx.strokeStyle = '#10b98133';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, 260, 220);
    ctx.strokeRect(380, 60, 260, 240);
    ctx.strokeRect(80, 360, 260, 260);

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.85,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);
    groundMeshRef.current = ground;

    // Surrounding context buildings & farm infrastructure
    const buildingMatA = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.6,
      roughness: 0.5
    });

    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3
    });
    const orangeBldg = new THREE.Mesh(new THREE.BoxGeometry(6, 9, 6), orangeMat);
    orangeBldg.position.set(14, 4.5, -4);
    orangeBldg.castShadow = true;
    scene.add(orangeBldg);

    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3
    });
    const blueBldg = new THREE.Mesh(new THREE.BoxGeometry(7, 8, 8), blueMat);
    blueBldg.position.set(-16, 4, 3);
    blueBldg.castShadow = true;
    scene.add(blueBldg);

    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
      roughness: 0.3
    });
    const greenBldg = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), greenMat);
    greenBldg.position.set(6, 3, 14);
    greenBldg.castShadow = true;
    scene.add(greenBldg);

    // Surrounding low-rise context cubes
    const smallBldgGeo = new THREE.BoxGeometry(2.5, 2, 2.5);
    const coords = [
      [-12, -10],
      [-16, -12],
      [-20, -8],
      [-22, -14],
      [-10, -18],
      [-4, -20],
      [2, -22],
      [8, -20],
      [14, -18],
      [20, -14],
      [22, -8],
      [20, 2],
      [22, 8],
      [-24, 2],
      [-22, 10],
      [-20, 16],
      [-14, 20],
      [14, 18],
      [20, 16]
    ];
    coords.forEach(([x, z]) => {
      const b = new THREE.Mesh(smallBldgGeo, buildingMatA);
      b.position.set(x, 1, z);
      b.castShadow = true;
      scene.add(b);
    });

    // 6. Central Focused Parcel: Multi-Stratum Extruded Layers
    const pWidth = 10;
    const pDepth = 8;
    const layerHeight = 1.25;

    meshesByStratumId.current.clear();

    activeParcel.strata.forEach((stratum) => {
      const yPos = (stratum.level + 0.5) * layerHeight;
      const baseColor = new THREE.Color(stratum.ownerColor);

      const geo = new THREE.BoxGeometry(pWidth, layerHeight * 0.94, pDepth);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        transparent: true,
        opacity: stratum.id === selectedStratumId ? 0.88 : 0.45,
        roughness: 0.2,
        metalness: 0.15,
        emissive: stratum.id === selectedStratumId ? baseColor : new THREE.Color(0x000000),
        emissiveIntensity: stratum.id === selectedStratumId ? 0.35 : 0
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, yPos, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { stratumId: stratum.id, stratum };

      const wireGeo = new THREE.EdgesGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({
        color: stratum.id === selectedStratumId ? 0xffffff : baseColor,
        linewidth: 2,
        transparent: true,
        opacity: 0.9
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wire);

      scene.add(mesh);
      meshesByStratumId.current.set(stratum.id, mesh);
    });

    // Outer Glowing Bounding Box Cage (Green Neon)
    const minY = -2.5 * layerHeight;
    const maxY = 8.5 * layerHeight;
    const cageHeight = maxY - minY;
    const cageCenterY = (maxY + minY) / 2;

    const cageGeo = new THREE.BoxGeometry(pWidth * 1.08, cageHeight, pDepth * 1.08);
    const cageEdges = new THREE.EdgesGeometry(cageGeo);
    const cageMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });
    const boundingCage = new THREE.LineSegments(cageEdges, cageMat);
    boundingCage.position.set(0, cageCenterY, 0);
    scene.add(boundingCage);
    boundingCageRef.current = boundingCage;

    // Ground footprint projection
    const groundOutlineGeo = new THREE.PlaneGeometry(pWidth * 1.35, pDepth * 1.35);
    const groundOutlineEdges = new THREE.EdgesGeometry(groundOutlineGeo);
    const groundOutlineMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 3
    });
    const groundOutline = new THREE.LineSegments(groundOutlineEdges, groundOutlineMat);
    groundOutline.rotation.x = -Math.PI / 2;
    groundOutline.position.set(0, 0.02, 0);
    scene.add(groundOutline);

    // Orbit & Mouse Interaction Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = {
      radius: 42,
      theta: 0.75,
      phi: 1.05
    };
    const target = new THREE.Vector3(0, 4.5, 0);

    const updateCameraPos = () => {
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      spherical.radius = Math.max(12, Math.min(90, spherical.radius));

      camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(target);

      const angleDeg = (spherical.theta * 180) / Math.PI;
      setCompassAngle(angleDeg);
    };

    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) {
        const rect = container.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        setCursorCoords({
          lat: Number((activeParcel.coordinates.lat + my * 0.002).toFixed(4)),
          lng: Number((activeParcel.coordinates.lng + mx * 0.002).toFixed(4)),
          elevation: Number((activeParcel.coordinates.elevation + (1 - my) * 2.5).toFixed(2))
        });
        return;
      }

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= deltaX * 0.008;
      spherical.phi -= deltaY * 0.008;
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius += e.deltaY * 0.025;
      updateCameraPos();
    };

    // Raycast on click
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouseVector, camera);
      const meshes = Array.from(meshesByStratumId.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const sId = hit.userData?.stratumId;
        if (sId) {
          setSelectedStratumId(sId);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // Animation loop for 3D Floating Tooltip Pin
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const selectedMesh = meshesByStratumId.current.get(selectedStratumId);
      if (selectedMesh && container) {
        const tempVec = new THREE.Vector3();
        selectedMesh.getWorldPosition(tempVec);
        tempVec.y += layerHeight * 0.7;
        tempVec.project(camera);

        const isBehind = tempVec.z > 1;
        const screenX = ((tempVec.x + 1) / 2) * container.clientWidth;
        const screenY = ((-tempVec.y + 1) / 2) * container.clientHeight;

        setTooltipPos({
          x: screenX,
          y: screenY,
          visible: !isBehind
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, [activeParcel]);

  // Handle Mode changes (3D vs Underground)
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    if (viewMode === 'Underground') {
      // Pivot camera below ground plane to inspect deep aquifers, borewells & geo-loops
      camera.position.set(22, -10, 22);
      camera.lookAt(0, -4, 0);
      setSelectedStratumId('basement-2');
      if (groundMeshRef.current) {
        (groundMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.35;
      }
    } else if (viewMode === '3D') {
      camera.position.set(28, 22, 28);
      camera.lookAt(0, 4, 0);
      if (selectedStratumId === 'basement-2') {
        setSelectedStratumId('floor-5');
      }
      if (groundMeshRef.current) {
        (groundMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 1.0;
      }
    }
  }, [viewMode]);

  // Synchronize 3D mesh highlighting when selectedStratumId changes
  useEffect(() => {
    meshesByStratumId.current.forEach((mesh, sId) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const wire = mesh.children[0] as THREE.LineSegments;
      const wireMat = wire?.material as THREE.LineBasicMaterial;
      const stratum = activeParcel.strata.find((s) => s.id === sId);

      if (sId === selectedStratumId) {
        mat.opacity = 0.92;
        mat.emissive = new THREE.Color(stratum?.ownerColor || 0x0284c7);
        mat.emissiveIntensity = 0.45;
        if (wireMat) {
          wireMat.color = new THREE.Color(0xffffff);
        }
      } else {
        mat.opacity = 0.45;
        mat.emissiveIntensity = 0;
        if (wireMat) {
          wireMat.color = new THREE.Color(stratum?.ownerColor || 0x555555);
        }
      }
    });
  }, [selectedStratumId, activeParcel]);

  // Handle Layer visibility updates
  useEffect(() => {
    if (boundingCageRef.current) {
      boundingCageRef.current.visible = layers.parcels;
    }
    meshesByStratumId.current.forEach((mesh, sId) => {
      const stratum = activeParcel.strata.find((s) => s.id === sId);
      if (stratum?.level! < 0) {
        mesh.visible = layers.undergroundUtility;
      } else {
        mesh.visible = layers.floors && layers.buildings;
      }
    });
  }, [layers, activeParcel]);

  // --------------------------------------------------------------------------
  // 2. LEAFLET 2D MAP INITIALIZATION & SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = leafletContainerRef.current;
    if (!container) return;

    const lat = activeParcel.coordinates.lat;
    const lng = activeParcel.coordinates.lng;

    // Initialize Leaflet Map if not created yet
    if (!leafletMapRef.current) {
      const map = L.map(container, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: false
      });

      // Layer 1: Esri Satellite High-Resolution Imagery
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri — Maxar, Earthstar Geographics',
          maxZoom: 19
        }
      );

      // Layer 2: OpenStreetMap Standard Cartographic
      const streetLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }
      );

      satelliteLayer.addTo(map);
      leafletTileLayerRef.current = satelliteLayer;

      // Add Zoom Control to Top Right
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    map.setView([lat, lng], 17);

    // Compute Cadastral Polygon Vertices around Centroid
    const dLat = 0.00065;
    const dLng = 0.00085;
    const parcelPolygonCoords: [number, number][] = [
      [lat + dLat, lng - dLng],
      [lat + dLat * 0.94, lng + dLng],
      [lat - dLat * 0.88, lng + dLng * 0.95],
      [lat - dLat, lng - dLng * 0.92]
    ];

    // Remove existing polygon & marker if any
    if (leafletPolygonRef.current) {
      leafletPolygonRef.current.remove();
    }
    if (leafletMarkerRef.current) {
      leafletMarkerRef.current.remove();
    }

    // 1. Add Neon Cadastral Farm Polygon
    const poly = L.polygon(parcelPolygonCoords, {
      color: '#10b981',
      weight: 3.5,
      fillColor: '#10b981',
      fillOpacity: 0.22,
      dashArray: '6 4'
    }).addTo(map);
    leafletPolygonRef.current = poly;

    // 2. Add Surrounding Neighboring Cadastre Plots
    const numMatch = (activeParcel.gatNo || '').match(/\d+/);
    const baseGatNum = numMatch ? parseInt(numMatch[0], 10) : 124;

    const neighborNorth: [number, number][] = [
      [lat + dLat * 1.05, lng - dLng * 1.1],
      [lat + dLat * 1.05, lng + dLng * 1.1],
      [lat + dLat * 2.1, lng + dLng * 1.05],
      [lat + dLat * 2.1, lng - dLng * 1.05]
    ];
    L.polygon(neighborNorth, {
      color: '#0284c7',
      weight: 1.5,
      fillColor: '#0284c7',
      fillOpacity: 0.12
    }).bindTooltip(`शेजारील गट क्र. ${baseGatNum + 1} (Adjoining Gat ${baseGatNum + 1})`, { permanent: false }).addTo(map);

    const eastGatNum = baseGatNum > 1 ? baseGatNum - 1 : baseGatNum + 2;
    const neighborEast: [number, number][] = [
      [lat - dLat * 0.8, lng + dLng * 1.15],
      [lat + dLat * 0.9, lng + dLng * 1.15],
      [lat + dLat * 0.85, lng + dLng * 2.2],
      [lat - dLat * 0.75, lng + dLng * 2.15]
    ];
    L.polygon(neighborEast, {
      color: '#f59e0b',
      weight: 1.5,
      fillColor: '#f59e0b',
      fillOpacity: 0.12
    }).bindTooltip(`शेजारील गट क्र. ${eastGatNum} (Adjoining Gat ${eastGatNum})`, { permanent: false }).addTo(map);

    // 3. Add Dynamic Farm Road Corridor Line
    const dpRoadLine: [number, number][] = [
      [lat - dLat * 1.4, lng - dLng * 2.8],
      [lat - dLat * 1.35, lng + dLng * 2.8]
    ];
    const roadLabel = activeParcel.zone
      ? `${activeParcel.zone} शेत रस्ता / पाणंद (Farm Approach Road)`
      : 'शेत रस्ता / पाणंद रस्ता (Farm Cadastre Access Road)';

    L.polyline(dpRoadLine, {
      color: '#ca8a04',
      weight: 6,
      opacity: 0.8,
      dashArray: '10 8'
    }).bindTooltip(roadLabel, { permanent: true, direction: 'bottom' }).addTo(map);

    // 4. Custom Pulsing ULPIN Marker
    const pinHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="background: rgba(12, 21, 36, 0.95); border: 2px solid #0284c7; border-radius: 8px; padding: 7px 14px; box-shadow: 0 4px 20px rgba(2, 132, 199, 0.6); text-align: center; color: white; white-space: nowrap; backdrop-filter: blur(8px);">
          <div style="font-size: 9px; font-weight: 800; color: #38bdf8; letter-spacing: 0.08em; text-transform: uppercase;">BHU-AADHAAR ULPIN</div>
          <div style="font-size: 11px; font-weight: 700; font-family: monospace; color: #ffffff; margin-top: 1px;">${activeParcel.ulpin}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Owner: <strong style="color: #38bdf8;">${activeParcel.ownerName}</strong></div>
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
    leafletMarkerRef.current = marker;

    // Bind Informative Cadastral Popup
    const popupContent = `
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px; min-width: 220px;">
        <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Cadastral Land Holding</div>
        <div style="font-size: 13px; font-weight: 800; margin: 3px 0;">${activeParcel.propertyName}</div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
        <div style="font-size: 11px; line-height: 1.5;">
          <div><strong>ULPIN:</strong> <span style="font-family: monospace;">${activeParcel.ulpin}</span></div>
          <div><strong>Owner:</strong> <span style="color: #0284c7; font-weight: 700;">${activeParcel.ownerName}</span></div>
          <div><strong>Gat No:</strong> ${activeParcel.gatNo}</div>
          <div><strong>Area:</strong> ${activeParcel.totalAreaAcres} Acres (${activeParcel.totalAreaSqFt} sq.ft)</div>
          <div><strong>Status:</strong> <span style="color: #10b981; font-weight: 700;">Verified (Geo-fenced)</span></div>
        </div>
      </div>
    `;
    poly.bindPopup(popupContent);
    marker.bindPopup(popupContent);

    // Click handler on map
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
        elevation: activeParcel.coordinates.elevation
      });
    });

    // Invalidate size on parcel change or mode toggle
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [activeParcel]);

  // Invalidate Leaflet size whenever user switches to 2D Map
  useEffect(() => {
    if (viewMode === '2D' && leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
        leafletMapRef.current?.setView(
          [activeParcel.coordinates.lat, activeParcel.coordinates.lng],
          17
        );
      }, 100);
    }
  }, [viewMode, activeParcel]);

  // Handle 2D Tile Style Change
  const handleMap2DStyleChange = (style: 'satellite' | 'street' | 'ndvi') => {
    setMap2DStyle(style);
    const map = leafletMapRef.current;
    if (!map) return;

    if (leafletTileLayerRef.current) {
      leafletTileLayerRef.current.remove();
    }

    if (style === 'satellite') {
      const sat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri — Maxar', maxZoom: 19 }
      ).addTo(map);
      leafletTileLayerRef.current = sat;
    } else {
      const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap', maxZoom: 19 }
      ).addTo(map);
      leafletTileLayerRef.current = street;
    }
  };

  // Camera preset handlers
  const handleResetCamera = () => {
    if (viewMode === '2D') {
      leafletMapRef.current?.setView(
        [activeParcel.coordinates.lat, activeParcel.coordinates.lng],
        17
      );
      return;
    }
    if (!cameraRef.current) return;
    cameraRef.current.position.set(28, 22, 28);
    cameraRef.current.lookAt(0, 4, 0);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (viewMode === '2D') {
      if (direction === 'in') leafletMapRef.current?.zoomIn();
      else leafletMapRef.current?.zoomOut();
      return;
    }
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.85 : 1.15;
    cameraRef.current.position.multiplyScalar(factor);
  };

  // Filter application
  const handleApplyFilters = () => {
    const foundKey = Object.keys(SAMPLE_PARCELS).find((k) => {
      const p = SAMPLE_PARCELS[k];
      return (
        (!selectedCity || p.city === selectedCity) &&
        (!selectedZone || p.zone === selectedZone)
      );
    });
    if (foundKey) {
      setActiveParcel(SAMPLE_PARCELS[foundKey]);
    } else {
      setActiveParcel({
        ...DEFAULT_PARCEL,
        city: selectedCity,
        zone: selectedZone,
        sector: selectedSector
      });
    }
  };

  const handleClearFilters = () => {
    setSelectedCity('Pune');
    setSelectedZone('Kothrud');
    setSelectedSector('P-125');
    setSelectedPropType('All');
    setSelectedOwnershipType('All');
    setSearchQuery('');
    setActiveParcel(DEFAULT_PARCEL);
    setSelectedStratumId('floor-5');
  };

  // Tool actions
  const runCadastreTool = (toolName: string) => {
    setActiveTool(toolName);
    switch (toolName) {
      case 'Measure':
        setToolResult('Laser Measure: Diagonal Baseline: 42.18m | Perimeter: 134.5m');
        break;
      case 'Distance':
        setToolResult('Distance to Mandi Road (DP Road): 14.8m | Nearest Canal: 84.0m');
        break;
      case 'Area':
        setToolResult(`Plot Footprint: ${activeParcel.totalAreaSqFt} sq.ft (${activeParcel.totalAreaAcres} Acres)`);
        break;
      case 'Volume':
        setToolResult('Topsoil Stratum Volume: 1,053 m³ | Aquifer Storage: 4,800 m³');
        break;
      case 'Elevation':
        setToolResult('Topographical Elevation: 560.45m MSL | Slope: 1.2% (East-facing)');
        break;
      case 'Print Map':
        window.print();
        setToolResult(null);
        break;
      case 'Share':
        navigator.clipboard.writeText(window.location.href);
        setToolResult('Cadastre Deep-Link copied to clipboard!');
        setTimeout(() => setToolResult(null), 3000);
        break;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 72px)',
        background: '#090d14',
        color: '#f1f5f9',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* 1. TOP HEADER & FILTER BAR (Matching Screenshot)                     */}
      {/* -------------------------------------------------------------------- */}
      <div
        style={{
          borderBottom: '1px solid #1e293b',
          background: 'rgba(15, 20, 30, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '10px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 40
        }}
      >
        {/* Upper Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          {/* Logo & System Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Box size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                3D ULPIN & Vertical Property Mapping System
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Visualizing Ownership & Agronomy in 3 Dimensions
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ flex: '1 1 340px', maxWidth: '520px', position: 'relative' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              placeholder="Search ULPIN, Owner, or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                background: '#131b28',
                border: '1px solid #233147',
                color: '#f8fafc',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* View Mode Switcher (2D Map / 3D Map / Underground) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#131b28',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid #233147'
            }}
          >
            {(['2D Map', '3D Map', 'Underground'] as const).map((mode) => {
              const val = mode.startsWith('2D') ? '2D' : mode.startsWith('3D') ? '3D' : 'Underground';
              const isActive = viewMode === val;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(val)}
                  style={{
                    padding: '7px 15px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? '#0284c7' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* User profile pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#131b28',
              border: '1px solid #233147'
            }}
          >
            <ShieldCheck size={16} color="#10b981" />
            <span style={{ fontWeight: 600 }}>{activeParcel.ownerName}</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>▾</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '4px'
          }}
        >
          {/* City */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>City</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="Pune">Pune</option>
              <option value="Nashik">Nashik</option>
              <option value="Satara">Satara</option>
              <option value="Nagpur">Nagpur</option>
            </select>
          </div>

          {/* Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Zone</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="Kothrud">Kothrud</option>
              <option value="Baramati">Baramati</option>
              <option value="Dindori">Dindori</option>
              <option value="Haveli">Haveli</option>
            </select>
          </div>

          {/* Sector / Parcel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Sector/Parcel</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="P-125">P-125 (Gat 142/A)</option>
              <option value="Gat 142/B">Gat 142/B</option>
              <option value="Gat 88">Gat 88 (Survey 98/A)</option>
            </select>
          </div>

          {/* Property Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Property Type</span>
            <select
              value={selectedPropType}
              onChange={(e) => setSelectedPropType(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="All">All Types</option>
              <option value="Apartment Unit">Apartment / Agro Unit</option>
              <option value="Polyhouse">Polyhouse Facility</option>
              <option value="Orchard">Orchard / Vineyard</option>
              <option value="Farmland">Farmland Cadastre</option>
            </select>
          </div>

          {/* Ownership Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Ownership Type</span>
            <select
              value={selectedOwnershipType}
              onChange={(e) => setSelectedOwnershipType(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="All">All Ownership</option>
              <option value="Private">Private Freehold</option>
              <option value="Joint">Joint Family</option>
              <option value="Government">Government / Panchayat</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={handleApplyFilters}
              style={{
                padding: '7px 18px',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                background: '#192333',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE (Left Nav + Center Viewport + Right Details)       */}
      {/* -------------------------------------------------------------------- */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Left Compact Navigation Bar (from screenshot) */}
        <div
          style={{
            width: '88px',
            background: '#0d131d',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            gap: '8px',
            zIndex: 20
          }}
        >
          <CompactNavItem
            icon={viewMode === '2D' ? <MapIcon size={18} /> : <Box size={18} />}
            label={viewMode === '2D' ? '2D Map' : '3D View'}
            active
          />
          <CompactNavItem icon={<Layers size={18} />} label="Properties" />
          <CompactNavItem icon={<Search size={18} />} label="ULPIN Search" />
          <CompactNavItem icon={<ShieldCheck size={18} />} label="Ownership" />
          <CompactNavItem icon={<SlidersHorizontal size={18} />} label="Layers" />
          <CompactNavItem icon={<FileText size={18} />} label="Reports" />
          <div style={{ flex: 1 }} />
          <CompactNavItem icon={<RotateCcw size={18} />} label="Reset View" onClick={handleResetCamera} />
        </div>

        {/* Center Interactive Viewport (Hosts BOTH 3D WebGL and 2D Leaflet) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#0a0e17',
            overflow: 'hidden'
          }}
        >
          {/* 3D Three.js Canvas Container (Shown when viewMode === '3D' or 'Underground') */}
          <div
            ref={mountRef}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'grab',
              display: viewMode !== '2D' ? 'block' : 'none'
            }}
          />

          {/* 2D Leaflet Map Container (Shown when viewMode === '2D') */}
          <div
            ref={leafletContainerRef}
            style={{
              width: '100%',
              height: '100%',
              display: viewMode === '2D' ? 'block' : 'none',
              position: 'absolute',
              inset: 0,
              zIndex: 10
            }}
          />

          {/* 2D Map Floating Controls (Satellite / Street Switcher) */}
          {viewMode === '2D' && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                gap: '4px',
                zIndex: 25,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}
            >
              <button
                onClick={() => handleMap2DStyleChange('satellite')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: map2DStyle === 'satellite' ? '#0284c7' : 'transparent',
                  color: map2DStyle === 'satellite' ? '#ffffff' : '#94a3b8'
                }}
              >
                🛰️ Satellite View
              </button>
              <button
                onClick={() => handleMap2DStyleChange('street')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: map2DStyle === 'street' ? '#0284c7' : 'transparent',
                  color: map2DStyle === 'street' ? '#ffffff' : '#94a3b8'
                }}
              >
                🗺️ Street Cadastre
              </button>
            </div>
          )}

          {/* 3D Floating Tooltip Pin (Only visible in 3D / Underground) */}
          {viewMode !== '2D' && tooltipPos.visible && (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 30,
                transition: 'top 0.05s ease-out, left 0.05s ease-out'
              }}
            >
              <div
                style={{
                  background: '#0c1524',
                  border: '1.5px solid #0284c7',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45)',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  minWidth: '220px'
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  ULPIN
                </div>
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    marginTop: '2px'
                  }}
                >
                  {activeParcel.ulpin}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Owner:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{activeParcel.ownerName}</span>
                </div>
              </div>
              <div
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '10px solid #0284c7',
                  margin: '0 auto'
                }}
              />
            </div>
          )}

          {/* Top-Left Ownership Legend (Only in 3D/Underground) */}
          {viewMode !== '2D' && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(14px)',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '12px 16px',
                zIndex: 15,
                fontSize: '0.78rem',
                minWidth: '160px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                Ownership Legend
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <LegendItem color="#2e7d32" label="Owner A (Canopy/Greenhouse)" />
                <LegendItem color="#1976d2" label="Owner B (5th-4th Precision Farm)" />
                <LegendItem color="#e65100" label="Owner C (1st-3rd Hydroponics)" />
                <LegendItem color="#fbc02d" label="Government / Owner D" />
                <LegendItem color="#7b1fa2" label="Underground Utility / Aquifer" />
              </div>
            </div>
          )}

          {/* Top-Right Gizmos & Controls (Compass, Reset, Zoom) */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              zIndex: 25
            }}
          >
            {/* Real-time Rotating Compass Gizmo */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1.5px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                transform: `rotate(${viewMode === '2D' ? 0 : compassAngle}deg)`,
                transition: 'transform 0.05s ease-out'
              }}
            >
              <div style={{ position: 'relative', width: '28px', height: '28px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderBottom: '12px solid #ef4444'
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
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '12px solid #94a3b8'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    fontWeight: 900,
                    color: '#ef4444'
                  }}
                >
                  N
                </span>
              </div>
            </div>

            {/* Zoom In (+) / Zoom Out (-) Controls */}
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
                onClick={() => handleZoom('in')}
                style={zoomBtnStyle}
                title="Zoom In"
              >
                +
              </button>
              <div style={{ height: '1px', background: '#334155' }} />
              <button
                onClick={() => handleZoom('out')}
                style={zoomBtnStyle}
                title="Zoom Out"
              >
                −
              </button>
            </div>

            {/* Reset View button */}
            <button
              onClick={handleResetCamera}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid #334155',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Bottom-Left Map Layers Box (from screenshot) */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px 16px',
              zIndex: 25,
              fontSize: '0.78rem',
              minWidth: '180px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '10px'
              }}
            >
              <span>Map Layers</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>✕</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LayerCheckbox
                label="Parcels (Boundaries)"
                checked={layers.parcels}
                onChange={(c) => setLayers((l) => ({ ...l, parcels: c }))}
              />
              <LayerCheckbox
                label="Buildings / Farm Structures"
                checked={layers.buildings}
                onChange={(c) => setLayers((l) => ({ ...l, buildings: c }))}
              />
              <LayerCheckbox
                label="Ownership Colors"
                checked={layers.ownership}
                onChange={(c) => setLayers((l) => ({ ...l, ownership: c }))}
              />
              <LayerCheckbox
                label="Floors / Strata"
                checked={layers.floors}
                onChange={(c) => setLayers((l) => ({ ...l, floors: c }))}
              />
              <LayerCheckbox
                label="Underground Utility / Aquifer"
                checked={layers.undergroundUtility}
                onChange={(c) => setLayers((l) => ({ ...l, undergroundUtility: c }))}
              />
              <LayerCheckbox
                label="Roads & Canal Lines"
                checked={layers.roads}
                onChange={(c) => setLayers((l) => ({ ...l, roads: c }))}
              />
              <LayerCheckbox
                label="Satellite Imagery"
                checked={layers.satelliteImagery}
                onChange={(c) => {
                  setLayers((l) => ({ ...l, satelliteImagery: c }));
                  if (viewMode === '2D') {
                    handleMap2DStyleChange(c ? 'satellite' : 'street');
                  }
                }}
              />
            </div>
          </div>

          {/* Bottom Center Spatial Tools Toolbar */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 25,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}
          >
            <CadastreToolBtn
              icon={<Ruler size={15} />}
              label="Measure"
              active={activeTool === 'Measure'}
              onClick={() => runCadastreTool('Measure')}
            />
            <CadastreToolBtn
              icon={<Compass size={15} />}
              label="Distance"
              active={activeTool === 'Distance'}
              onClick={() => runCadastreTool('Distance')}
            />
            <CadastreToolBtn
              icon={<Maximize2 size={15} />}
              label="Area"
              active={activeTool === 'Area'}
              onClick={() => runCadastreTool('Area')}
            />
            <CadastreToolBtn
              icon={<Box size={15} />}
              label="Volume"
              active={activeTool === 'Volume'}
              onClick={() => runCadastreTool('Volume')}
            />
            <CadastreToolBtn
              icon={<Layers size={15} />}
              label="Elevation"
              active={activeTool === 'Elevation'}
              onClick={() => runCadastreTool('Elevation')}
            />
            <div style={{ width: '1px', height: '20px', background: '#334155' }} />
            <CadastreToolBtn
              icon={<Printer size={15} />}
              label="Print Map"
              onClick={() => runCadastreTool('Print Map')}
            />
            <CadastreToolBtn
              icon={<Share2 size={15} />}
              label="Share"
              onClick={() => runCadastreTool('Share')}
            />
          </div>

          {/* Active Tool Result Toast */}
          {toolResult && (
            <div
              style={{
                position: 'absolute',
                bottom: '76px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0284c7',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.45)',
                zIndex: 35
              }}
            >
              {toolResult}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 3. RIGHT SIDEBAR: PROPERTY & FLOOR-WISE CADASTRE DETAILS           */}
        {/* ------------------------------------------------------------------ */}
        <div
          style={{
            width: '380px',
            background: '#0d131d',
            borderLeft: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 20
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              Property Details
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={13} />
              <span>Verified</span>
            </div>
          </div>

          {/* Content Body */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ULPIN Copy Card */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                ULPIN: UNIQUE LAND PARCEL IDENTIFICATION
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#131b28',
                  border: '1px solid #1e2d42',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginTop: '6px'
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#38bdf8'
                  }}
                >
                  {activeParcel.ulpin}
                </span>
                <button
                  onClick={handleCopyULPIN}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedULPIN ? '#10b981' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Copy ULPIN"
                >
                  {copiedULPIN ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Key-Value Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Property Type" value={activeParcel.propertyType} />
              <DetailRow label="Building / Gat ID" value={`${activeParcel.buildingId} (${activeParcel.gatNo})`} />
              <DetailRow label="Floor / Stratum" value={`${activeStratum.name} (${activeStratum.subName})`} />
              <DetailRow label="Unit No." value={activeStratum.unitNo} />
              <DetailRow
                label="Owner Name"
                value={
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {activeStratum.owner.includes('Owner B')
                      ? activeParcel.ownerName
                      : activeStratum.owner}
                  </span>
                }
              />
              <DetailRow label="Ownership Type" value={activeParcel.ownershipType} />
              <DetailRow
                label="Area"
                value={`${activeStratum.areaSqFt} sq.ft (${((activeStratum.areaSqFt / 43560) * 100).toFixed(2)} % plot)`}
              />
              <DetailRow label="Vertical Range" value={activeStratum.verticalRange} />
              <DetailRow
                label="Status"
                value={
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    {activeStratum.status} (Geo-tagged)
                  </span>
                }
              />
              <DetailRow label="Registration No." value={activeParcel.registrationNo} />
            </div>

            {/* Floor-wise Ownership Interactive Table */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Floor-wise Ownership & Stratification
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click row to highlight 3D</span>
              </div>

              <div
                style={{
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#111827'
                }}
              >
                {activeParcel.strata.map((s) => {
                  const isSelected = s.id === selectedStratumId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStratumId(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                        borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                        borderBottom: '1px solid #1f2937',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSelected && <ChevronRight size={14} color="#38bdf8" />}
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#ffffff' : '#cbd5e1'
                          }}
                        >
                          {s.name}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: `${s.ownerColor}33`,
                          color: s.ownerColor,
                          border: `1px solid ${s.ownerColor}66`
                        }}
                      >
                        {s.owner}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Button Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setShowDocModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
                }}
              >
                <FileText size={16} />
                <span>View Ownership Document</span>
              </button>

              <button
                onClick={() => {
                  const dataStr =
                    'data:text/json;charset=utf-8,' +
                    encodeURIComponent(JSON.stringify(activeParcel, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `${activeParcel.ulpin}_3d_cadastre.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#192333',
                  color: '#cbd5e1',
                  border: '1px solid #29384d',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Download size={16} />
                <span>Download 3D Model</span>
              </button>

              <button
                onClick={() => setShowDisputeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <AlertTriangle size={16} />
                <span>Report Discrepancy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. BOTTOM GEOGRAPHIC COORDINATES & CRS STATUS BAR (from screenshot)  */}
      {/* -------------------------------------------------------------------- */}
      <div
        style={{
          borderTop: '1px solid #1e293b',
          background: '#090d14',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: '#64748b',
          fontFamily: 'monospace',
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Latitude: <strong style={{ color: '#cbd5e1' }}>{cursorCoords.lat}° N</strong></span>
          <span>Longitude: <strong style={{ color: '#cbd5e1' }}>{cursorCoords.lng}° E</strong></span>
          <span>Elevation: <strong style={{ color: '#cbd5e1' }}>{cursorCoords.elevation} m</strong></span>
          <span>Accuracy: <strong style={{ color: '#10b981' }}>{activeParcel.accuracy}</strong></span>
          <span>CRS: <strong style={{ color: '#cbd5e1' }}>{activeParcel.crs}</strong></span>
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif' }}>
          © 2024 3D ULPIN System. All rights reserved.
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. OWNERSHIP DOCUMENT MODAL (7/12 Extract & Title Deed Preview)      */}
      {/* -------------------------------------------------------------------- */}
      {showDocModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1e293b',
                paddingBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#38bdf8" />
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  Government Land Cadastre Extract (7/12 & 3D Title)
                </span>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ margin: '18px 0', fontSize: '0.84rem', lineHeight: '1.6' }}>
              <div
                style={{
                  background: '#1e293b',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <div><strong>State:</strong> Maharashtra</div>
                <div><strong>District / Taluka:</strong> {activeParcel.city} / {activeParcel.zone}</div>
                <div><strong>ULPIN:</strong> {activeParcel.ulpin}</div>
                <div><strong>Survey / Gat No.:</strong> {activeParcel.gatNo}</div>
                <div><strong>Registered Owner:</strong> {activeParcel.ownerName}</div>
                <div><strong>Registration No.:</strong> {activeParcel.registrationNo}</div>
                <div><strong>Total Land Area:</strong> {activeParcel.totalAreaAcres} Acres ({activeParcel.totalAreaSqFt} sq.ft)</div>
                <div><strong>Vertical Stratum:</strong> {activeStratum.name} ({activeStratum.verticalRange})</div>
              </div>

              <p style={{ color: '#94a3b8' }}>
                This certified digital record affirms the cadastral title and 3D spatial rights under
                the National Land Record Modernization Programme (NLRMP) and Digital India Land Record
                Information System.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowDocModal(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. REPORT DISCREPANCY MODAL                                          */}
      {/* -------------------------------------------------------------------- */}
      {showDisputeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              color: '#f8fafc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
              <AlertTriangle size={22} />
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Report Cadastre Discrepancy</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '14px 0' }}>
              Notice a boundary offset, stratum height mismatch, or incorrect ownership tag for ULPIN{' '}
              <strong style={{ color: '#f8fafc' }}>{activeParcel.ulpin}</strong>? Submit an inquiry for
              drone resurvey by the district revenue office.
            </p>
            <textarea
              placeholder="Describe the discrepancy (e.g. boundary fence offset by 1.2m on East canal)..."
              rows={4}
              style={{
                width: '100%',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '10px',
                color: '#ffffff',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => setShowDisputeModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Discrepancy report filed successfully with Department of Land Records.');
                  setShowDisputeModal(false);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Submit Discrepancy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const CompactNavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 4px',
      width: '72px',
      borderRadius: '8px',
      background: active ? '#1e293b' : 'transparent',
      border: active ? '1px solid #334155' : '1px solid transparent',
      color: active ? '#38bdf8' : '#64748b',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }}
  >
    {icon}
    <span style={{ fontSize: '0.66rem', fontWeight: active ? 700 : 500 }}>{label}</span>
  </button>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '3px',
        background: color,
        boxShadow: `0 0 8px ${color}88`
      }}
    />
    <span style={{ color: '#cbd5e1' }}>{label}</span>
  </div>
);

const LayerCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      color: checked ? '#f8fafc' : '#64748b'
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ accentColor: '#0284c7', cursor: 'pointer' }}
    />
    <span>{label}</span>
  </label>
);

const CadastreToolBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '6px',
      background: active ? '#0284c7' : '#1e293b',
      color: active ? '#ffffff' : '#cbd5e1',
      border: 'none',
      fontSize: '0.74rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '0.78rem'
    }}
  >
    <span style={{ color: '#94a3b8', minWidth: '100px' }}>{label}</span>
    <span style={{ color: '#f8fafc', fontWeight: 500, textAlign: 'right' }}>{value}</span>
  </div>
);

const filterSelectStyle: React.CSSProperties = {
  background: '#131b28',
  border: '1px solid #233147',
  borderRadius: '6px',
  color: '#f8fafc',
  padding: '6px 10px',
  fontSize: '0.78rem',
  fontWeight: 600,
  outline: 'none',
  cursor: 'pointer'
};

const zoomBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '30px',
  background: 'transparent',
  border: 'none',
  color: '#cbd5e1',
  fontSize: '18px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
