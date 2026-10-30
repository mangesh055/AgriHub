// Realistically styled SVG data URLs for instant demo testing
export interface DemoSample {
  id: string;
  name: string;
  crop: string;
  description: string;
  dataUrl: string;
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'soybean-rust',
    name: 'Soybean (Rust)',
    crop: 'Soybean',
    description: 'Trifoliate leaflet with dense reddish-brown rust pustules',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="leafGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stop-color="%23558b2f"/>
          <stop offset="70%" stop-color="%2333691e"/>
          <stop offset="100%" stop-color="%231b5e20"/>
        </radialGradient>
        <filter id="pustuleGlow">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="%234a1505" flood-opacity="0.8"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="%231a241b"/>
      <!-- Main Leaf Blade -->
      <path d="M 200 40 C 310 90 350 220 220 340 C 190 370 170 380 160 380 C 150 370 60 250 80 140 C 100 60 170 40 200 40 Z" fill="url(%23leafGrad)" stroke="%232e7d32" stroke-width="3"/>
      <!-- Main Midrib Vein -->
      <path d="M 200 40 Q 195 200 160 380" stroke="%238bc34a" stroke-width="5" fill="none"/>
      <!-- Lateral Veins -->
      <path d="M 197 120 Q 250 140 290 170" stroke="%237cb342" stroke-width="2.5" fill="none" opacity="0.8"/>
      <path d="M 195 180 Q 260 200 280 250" stroke="%237cb342" stroke-width="2.5" fill="none" opacity="0.8"/>
      <path d="M 190 240 Q 240 270 250 310" stroke="%237cb342" stroke-width="2" fill="none" opacity="0.8"/>
      <path d="M 197 120 Q 140 140 100 170" stroke="%237cb342" stroke-width="2.5" fill="none" opacity="0.8"/>
      <path d="M 195 180 Q 130 210 110 260" stroke="%237cb342" stroke-width="2.5" fill="none" opacity="0.8"/>
      <!-- Rust Pustules (Reddish Brown Spots) -->
      <g filter="url(%23pustuleGlow)">
        <circle cx="160" cy="150" r="8" fill="%23b71c1c"/>
        <circle cx="160" cy="150" r="5" fill="%23ff7043"/>
        <circle cx="230" cy="160" r="10" fill="%23880e4f"/>
        <circle cx="230" cy="160" r="6" fill="%23d84315"/>
        <circle cx="180" cy="220" r="12" fill="%23bf360c"/>
        <circle cx="180" cy="220" r="7" fill="%23ff8a65"/>
        <circle cx="240" cy="230" r="9" fill="%23a82e08"/>
        <circle cx="140" cy="250" r="11" fill="%238c1d04"/>
        <circle cx="200" cy="280" r="8" fill="%239e2a0b"/>
        <circle cx="150" cy="190" r="7" fill="%23b71c1c"/>
        <circle cx="220" cy="110" r="6" fill="%23d84315"/>
        <circle cx="170" cy="90" r="5" fill="%23bf360c"/>
        <circle cx="260" cy="190" r="8" fill="%23ff7043"/>
      </g>
      <text x="200" y="385" font-family="sans-serif" font-size="12" fill="%238bc34a" text-anchor="middle">Soybean Specimen • Phakopsora pachyrhizi</text>
    </svg>`
  },
  {
    id: 'tomato-early-blight',
    name: 'Tomato (Early Blight)',
    crop: 'Tomato',
    description: 'Target-board concentric necrotic lesions with yellow chlorotic halos',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="tomLeaf" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="%23689f38"/>
          <stop offset="80%" stop-color="%2333691e"/>
          <stop offset="100%" stop-color="%231b5e20"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="%23182117"/>
      <!-- Serrated Tomato Leaflet -->
      <path d="M 200 40 C 240 60 270 80 250 110 C 290 120 320 160 280 180 C 310 210 320 260 270 280 C 260 320 230 350 180 370 C 140 330 110 310 130 270 C 80 250 80 190 120 180 C 80 140 120 90 160 100 Z" fill="url(%23tomLeaf)" stroke="%232e7d32" stroke-width="3"/>
      <!-- Main Midrib -->
      <path d="M 200 40 Q 195 200 180 370" stroke="%239ccc65" stroke-width="4.5" fill="none"/>
      <!-- Concentric Target Ring Lesions (Alternaria solani) -->
      <!-- Lesion 1 -->
      <circle cx="160" cy="180" r="32" fill="%23ffd54f" opacity="0.45"/>
      <circle cx="160" cy="180" r="24" fill="%23422013"/>
      <circle cx="160" cy="180" r="18" fill="%235d2c18" stroke="%232e1208" stroke-width="2"/>
      <circle cx="160" cy="180" r="11" fill="%23422013" stroke="%232e1208" stroke-width="2"/>
      <circle cx="160" cy="180" r="5" fill="%231a0a04"/>
      <!-- Lesion 2 -->
      <circle cx="230" cy="240" r="28" fill="%23ffe082" opacity="0.4"/>
      <circle cx="230" cy="240" r="20" fill="%233e1d11"/>
      <circle cx="230" cy="240" r="14" fill="%235d2c18" stroke="%23270f06" stroke-width="1.8"/>
      <circle cx="230" cy="240" r="8" fill="%233e1d11"/>
      <circle cx="230" cy="240" r="3" fill="%231a0a04"/>
      <!-- Lesion 3 -->
      <circle cx="210" cy="120" r="18" fill="%23ffd54f" opacity="0.35"/>
      <circle cx="210" cy="120" r="12" fill="%23422013"/>
      <circle cx="210" cy="120" r="6" fill="%23270f06"/>
      <text x="200" y="388" font-family="sans-serif" font-size="12" fill="%23aed581" text-anchor="middle">Tomato Specimen • Alternaria solani</text>
    </svg>`
  },
  {
    id: 'rice-blast',
    name: 'Rice (Leaf Blast)',
    crop: 'Rice',
    description: 'Elongated spindle-shaped lesions with grey center and dark brown border',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="riceBlade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="%232e7d32"/>
          <stop offset="35%" stop-color="%234caf50"/>
          <stop offset="50%" stop-color="%2381c784"/>
          <stop offset="65%" stop-color="%234caf50"/>
          <stop offset="100%" stop-color="%232e7d32"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="%23141f17"/>
      <!-- Narrow Rice Leaf Blade -->
      <path d="M 195 20 Q 200 10 205 20 L 250 380 L 150 380 Z" fill="url(%23riceBlade)" stroke="%231b5e20" stroke-width="2"/>
      <!-- Longitudinal veins -->
      <line x1="200" y1="20" x2="200" y2="380" stroke="%23c8e6c9" stroke-width="2.5" opacity="0.7"/>
      <line x1="180" y1="50" x2="175" y2="380" stroke="%23a5d6a7" stroke-width="1.2" opacity="0.5"/>
      <line x1="220" y1="50" x2="225" y2="380" stroke="%23a5d6a7" stroke-width="1.2" opacity="0.5"/>
      <!-- Spindle lesions (Magnaporthe oryzae) -->
      <!-- Lesion 1 -->
      <path d="M 200 120 Q 220 150 200 180 Q 180 150 200 120 Z" fill="%23cfd8dc" stroke="%235d4037" stroke-width="4"/>
      <path d="M 200 135 Q 210 150 200 165 Q 190 150 200 135 Z" fill="%23eceff1"/>
      <!-- Lesion 2 -->
      <path d="M 190 230 Q 212 260 190 290 Q 170 260 190 230 Z" fill="%23b0bec5" stroke="%234e342e" stroke-width="3.5"/>
      <path d="M 190 245 Q 200 260 190 275 Q 180 260 190 245 Z" fill="%23cfd8dc"/>
      <text x="200" y="392" font-family="sans-serif" font-size="12" fill="%23a5d6a7" text-anchor="middle">Paddy Rice Specimen • Magnaporthe oryzae</text>
    </svg>`
  },
  {
    id: 'healthy-specimen',
    name: 'Healthy Crop Leaf',
    crop: 'auto',
    description: 'Vibrant, turgid leaf with intact cuticle and zero lesions',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="healthyGrad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="%2381c784"/>
          <stop offset="50%" stop-color="%2343a047"/>
          <stop offset="90%" stop-color="%232e7d32"/>
          <stop offset="100%" stop-color="%231b5e20"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="%23162217"/>
      <!-- Perfectly Healthy Elliptic Leaf -->
      <path d="M 200 35 C 310 80 340 210 220 345 C 195 375 180 380 170 380 C 160 380 70 260 80 145 C 90 70 160 35 200 35 Z" fill="url(%23healthyGrad)" stroke="%23388e3c" stroke-width="3.5"/>
      <!-- Elegant midrib and venation -->
      <path d="M 200 35 Q 195 200 170 380" stroke="%23c8e6c9" stroke-width="4.5" fill="none" opacity="0.9"/>
      <path d="M 198 100 Q 250 120 285 150" stroke="%23a5d6a7" stroke-width="2.2" fill="none" opacity="0.75"/>
      <path d="M 198 100 Q 145 120 110 150" stroke="%23a5d6a7" stroke-width="2.2" fill="none" opacity="0.75"/>
      <path d="M 195 170 Q 255 190 280 230" stroke="%23a5d6a7" stroke-width="2.2" fill="none" opacity="0.75"/>
      <path d="M 195 170 Q 135 190 115 235" stroke="%23a5d6a7" stroke-width="2.2" fill="none" opacity="0.75"/>
      <path d="M 190 240 Q 240 265 255 305" stroke="%23a5d6a7" stroke-width="1.8" fill="none" opacity="0.75"/>
      <path d="M 190 240 Q 140 265 130 305" stroke="%23a5d6a7" stroke-width="1.8" fill="none" opacity="0.75"/>
      <circle cx="260" cy="110" r="4" fill="%23e8f5e9" opacity="0.7"/>
      <circle cx="270" cy="115" r="2.5" fill="%23e8f5e9" opacity="0.5"/>
      <text x="200" y="388" font-family="sans-serif" font-size="12" fill="%23a5d6a7" text-anchor="middle">Normal Healthy Foliage • No Foliar Lesions</text>
    </svg>`
  }
];

