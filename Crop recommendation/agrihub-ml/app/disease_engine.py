import numpy as np
import os
import io
import json
import base64
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import torch
from PIL import Image
from safetensors.torch import load_file
import timm
from huggingface_hub import hf_hub_download

REPO_ID = "ixrbhii/multicrop-disease-models"

# Map user-friendly crop names to repository subfolder names
CROP_FOLDER_MAP = {
    "soybean": "Soybean",
    "glycine max": "Soybean",
    "tomato": "Tomato",
    "solanum lycopersicum": "Tomato",
    "rice": "Rice",
    "oryza sativa": "Rice",
    "maize": "Maize",
    "corn": "Maize",
    "maka": "Maize",
    "makka": "Maize",
    "zea mays": "Maize",
    "potato": "Potato",
    "solanum tuberosum": "Potato",
    "sugarcane": "Sugarcane",
    "saccharum officinarum": "Sugarcane",
    "grape": "Grape",
    "grapes": "Grape",
    "vitis vinifera": "Grape",
    "mango": "Mango",
    "mangifera indica": "Mango",
    "okra": "okra",
    "bhindi": "okra",
    "abelmoschus esculentus": "okra",
    "brinjal": "Brinjal",
    "eggplant": "Brinjal",
    "solanum melongena": "Brinjal",
    "cucumber": "Cucumber",
    "cucumis sativus": "Cucumber",
    "bitter gourd": "Bitter_gourd",
    "bitter_gourd": "Bitter_gourd",
    "karela": "Bitter_gourd",
    "bottle gourd": "Bottle_gourd",
    "bottle_gourd": "Bottle_gourd",
    "dudhi": "Bottle_gourd",
    "ridge gourd": "Ridge_gourd",
    "ridge_gourd": "Ridge_gourd",
    "snake gourd": "Snake_gourd",
    "snake_gourd": "Snake_gourd",
    "pomegranate": "pomrgranet",
    "pomrgranet": "pomrgranet",
    "punica granatum": "pomrgranet",
    "dalimb": "pomrgranet",
    "apple": "Apple",
    "apricot": "Apricot",
    "banana": "Banana",
    "musa": "Banana",
    "betel": "Betel",
    "black pepper": "Black_Pepper",
    "black_pepper": "Black_Pepper",
    "cashew": "Cashew",
    "cassava": "Cassava",
    "cherry": "Cherry",
    "chrysanthemum": "Chrysanthemum",
    "citrus": "Citrus",
    "lemon": "Citrus",
    "sweet lime": "Citrus",
    "coconut": "Coconut",
    "coffee": "Coffee",
    "cucurbit": "Cucurbit",
    "custard apple": "Custard_apple",
    "custard_apple": "Custard_apple",
    "sitaphal": "Custard_apple",
    "fig": "Fig",
    "anjeer": "Fig",
    "guava": "Guava",
    "loquat": "Loquat",
    "mulberry": "Mulberry",
    "papaya": "Papaya",
    "peach": "Peach",
    "pear": "Pear",
    "rose": "Rose",
    "strawberry": "Strawberry",
    "tea": "Tea",
    "walnut": "Walnut",
    "watermelon": "Watermelon",
    "cotton": "detectors/new", # Special routing
}

# Scientific & Display names for crops
CROP_DISPLAY_NAMES = {
    "Soybean": "Soybean (Glycine max)",
    "Tomato": "Tomato (Solanum lycopersicum)",
    "Rice": "Rice / Paddy (Oryza sativa)",
    "Maize": "Maize / Corn / मका (Zea mays)",
    "Potato": "Potato (Solanum tuberosum)",
    "Sugarcane": "Sugarcane (Saccharum officinarum)",
    "Grape": "Grape (Vitis vinifera)",
    "Mango": "Mango (Mangifera indica)",
    "okra": "Okra / Bhindi (Abelmoschus esculentus)",
    "Brinjal": "Brinjal / Eggplant (Solanum melongena)",
    "Cucumber": "Cucumber (Cucumis sativus)",
    "Bitter_gourd": "Bitter Gourd / Karela (Momordica charantia)",
    "Bottle_gourd": "Bottle Gourd / Lauki (Lagenaria siceraria)",
    "Ridge_gourd": "Ridge Gourd / Dodka (Luffa acutangula)",
    "Snake_gourd": "Snake Gourd (Trichosanthes cucumerina)",
    "pomrgranet": "Pomegranate / Dalimb (Punica granatum)",
    "Apple": "Apple (Malus domestica)",
    "Banana": "Banana (Musa acuminata)",
    "Citrus": "Citrus / Sweet Lime (Citrus sinensis)",
    "Coconut": "Coconut (Cocos nucifera)",
    "Coffee": "Coffee (Coffea arabica)",
    "Custard_apple": "Custard Apple / Sitaphal (Annona squamosa)",
    "Papaya": "Papaya (Carica papaya)",
    "Strawberry": "Strawberry (Fragaria × ananassa)",
    "Watermelon": "Watermelon (Citrullus lanatus)",
    "Cotton": "Bt Cotton (Gossypium hirsutum)",
}

# In-memory model cache: key -> (model, config)
_MODEL_CACHE: Dict[str, Tuple[torch.nn.Module, Dict[str, Any]]] = {}

def get_normalized_crop_key(crop_input: Optional[str]) -> Optional[str]:
    if not crop_input:
        return None
    cleaned = crop_input.strip().lower()
    if cleaned in ["auto", "auto-detect", "detect", "all", "unknown"]:
        return None
    for pattern, folder in CROP_FOLDER_MAP.items():
        if pattern in cleaned or folder.lower() == cleaned:
            return folder
    return None

def is_online() -> bool:
    """Quick socket check to verify internet reachability without hanging on retries."""
    try:
        import socket
        with socket.create_connection(("huggingface.co", 443), timeout=0.8):
            return True
    except Exception:
        return False

def load_crop_model(folder_name: str) -> Tuple[torch.nn.Module, Dict[str, Any]]:
    """Loads and caches ConvNeXt model and config for a given folder in HuggingFace repo or local storage."""
    global _MODEL_CACHE
    if folder_name in _MODEL_CACHE:
        return _MODEL_CACHE[folder_name]

    config_filename = f"{folder_name}/config.json"
    weights_filename = f"{folder_name}/model.safetensors"

    cfg_path = None
    weights_path = None

    # 0. Priority: Check local custom fine-tuned models directory first
    local_dir = Path(__file__).resolve().parent.parent / "models" / folder_name
    local_cfg = local_dir / "config.json"
    local_weights = local_dir / "model.safetensors"
    if local_cfg.exists() and local_weights.exists():
        cfg_path = str(local_cfg)
        weights_path = str(local_weights)
        print(f"[AgriHub ML] Loaded fine-tuned model from local storage: {local_dir}")

    # 1. Try local HuggingFace cache (offline-friendly)
    if not cfg_path or not weights_path:
        try:
            cfg_path = hf_hub_download(repo_id=REPO_ID, filename=config_filename, local_files_only=True)
            weights_path = hf_hub_download(repo_id=REPO_ID, filename=weights_filename, local_files_only=True)
        except Exception:
            # 2. Try online download if internet is reachable
            if is_online():
                try:
                    cfg_path = hf_hub_download(repo_id=REPO_ID, filename=config_filename, local_files_only=False)
                    weights_path = hf_hub_download(repo_id=REPO_ID, filename=weights_filename, local_files_only=False)
                except Exception:
                    pass

            # 3. If still not loaded, fallback to a cached staple crop model (e.g. Soybean)
            if not cfg_path or not weights_path:
                fallback_folder = "Soybean"
                if folder_name != fallback_folder:
                    return load_crop_model(fallback_folder)
                raise RuntimeError(f"Cannot load model for {folder_name}")

    with open(cfg_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    state_dict = load_file(weights_path)

    arch = config.get("arch") or config.get("model_architecture", "convnext_small")
    num_classes = len(config.get("classes", []))

    model = timm.create_model(arch, pretrained=False, num_classes=num_classes)
    model.load_state_dict(state_dict, strict=False)
    model.eval()

    _MODEL_CACHE[folder_name] = (model, config)
    return model, config

def preprocess_image(image_input: Any) -> torch.Tensor:
    """Preprocesses image (PIL, bytes, base64, or filepath) to normalized tensor [1, 3, 224, 224]."""
    if isinstance(image_input, str):
        # Check if base64 data URL
        if image_input.startswith("data:image"):
            base64_data = re.sub(r"^data:image\/[a-zA-Z0-9.-]+;base64,", "", image_input)
            image_bytes = base64.b64decode(base64_data)
            img = Image.open(io.BytesIO(image_bytes))
        elif os.path.exists(image_input):
            img = Image.open(image_input)
        else:
            # Try raw base64 string
            try:
                image_bytes = base64.b64decode(image_input)
                img = Image.open(io.BytesIO(image_bytes))
            except Exception:
                raise ValueError("Cannot read image from provided string path/data.")
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input))
    elif isinstance(image_input, Image.Image):
        img = image_input
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    img = img.convert("RGB")
    img = img.resize((224, 224), Image.Resampling.BILINEAR)

    # Standard ImageNet normalization for ConvNeXt
    tensor = torch.tensor(list(img.getdata()), dtype=torch.float32).reshape(224, 224, 3)
    tensor = tensor.permute(2, 0, 1) / 255.0  # [3, 224, 224]

    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    normalized = (tensor - mean) / std
    return normalized.unsqueeze(0), img  # [1, 3, 224, 224], raw PIL image

# Comprehensive CIBRC-compliant Agronomic Knowledge Base
AGRONOMIC_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    # Soybean
    "Soybean_Downy_mildew": {
        "disease_name": "Downy Mildew (Peronospora manshurica)",
        "severity": "MEDIUM",
        "symptoms": [
            "Pale green to light yellow angular chlorotic spots on upper leaf surface",
            "Greyish-purple fluffy fungal downy growth on the corresponding lower surface",
            "Severely affected leaves curl downwards, turn brown, and drop prematurely"
        ],
        "organic_treatments": [
            "Foliar spray of Trichoderma viride / harzianum @ 5g/L during early morning or sunset",
            "Neem Seed Kernel Extract (NSKE 5%) or 10,000 ppm cold-pressed neem oil @ 3ml/L",
            "Milk-water foliar mixture (1:9 ratio) as an organic mild antifungal barrier"
        ],
        "chemical_controls": [
            "Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2g/L (systemic and contact action)",
            "Copper Oxychloride 50% WP (Blitox) @ 2.5g/L preventive spray",
            "Observe a mandatory 14-day Pre-Harvest withholding Interval (PHI)"
        ],
        "prevention_tips": [
            "Avoid excessive seed density; maintain 45cm row-to-row spacing for canopy airflow",
            "Practice 2-year crop rotation with non-leguminous crops such as Maize or Sorghum",
            "Treat seed prior to sowing with Thiram 75% WP @ 3g/kg seed"
        ]
    },
    "Soybean_Frogeye_leaf_spot": {
        "disease_name": "Frogeye Leaf Spot (Cercospora sojina)",
        "severity": "HIGH",
        "symptoms": [
            "Small circular to angular lesions with grey-tan centers and narrow dark reddish-brown borders",
            "Lesions coalesce to form extensive necrotic patches causing premature leaf drop",
            "Can cause significant pod and seed infection, reducing test weight and oil content"
        ],
        "organic_treatments": [
            "Foliar spray of Pseudomonas fluorescens (10^8 cfu/g) @ 5g/L at first disease sign",
            "Foliar application of fermented cow urine + neem leaf extract @ 50ml/L water",
            "Rogue and burn infected crop residues immediately after harvest"
        ],
        "chemical_controls": [
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top) @ 1ml/L water",
            "Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L water",
            "Tebuconazole 25.9% EC (Folicur) @ 1.25ml/L at flowering to early pod set"
        ],
        "prevention_tips": [
            "Plant certified resistant varieties (e.g. JS-335, Phule Sangam / KDS-726, MAUS-158)",
            "Adopt deep summer plowing to bury infested residue below microbial degradation depth",
            "Avoid overhead sprinkler irrigation; transition to drip lines"
        ]
    },
    "Soybean_Rust": {
        "disease_name": "Asian Soybean Rust (Phakopsora pachyrhizi)",
        "severity": "HIGH",
        "symptoms": [
            "Tiny pinhead-sized polygonal chlorotic flecks on upper leaf lamina",
            "Raised volcanic reddish-brown to tan pustules (uredinia) on leaf undersides",
            "Rapid defoliation within 7-10 days under warm, humid overcast conditions"
        ],
        "organic_treatments": [
            "Foliar bio-spray of Trichoderma harzianum @ 5g/L every 10 days",
            "Neem oil 10,000 ppm @ 3-4ml/L with wetting agent (sandovit)",
            "Botanical extract spray of Garlic-Chili extract (10%)"
        ],
        "chemical_controls": [
            "Hexaconazole 5% SC (Contaf) @ 1.5ml/L immediately at first rust pustule sighting",
            "Propiconazole 25% EC (Tilt) @ 1ml/L (CIBRC approved rust curative)",
            "Azoxystrobin 23% SC @ 1ml/L preventive buffer spray"
        ],
        "prevention_tips": [
            "Scout lower leaf canopy bi-weekly after flower initiation",
            "Maintain balanced fertilization; avoid excess nitrogen which induces lush foliage",
            "Ensure early morning fungicide application to guarantee absorption before midday heat"
        ]
    },
    "Soybean_Septoria_brown_spot": {
        "disease_name": "Septoria Brown Spot (Septoria glycines)",
        "severity": "MEDIUM",
        "symptoms": [
            "Irregular dark brown angular spots on lower leaves that yellow around margins",
            "Infection progresses gradually upwards through the canopy during wet weather",
            "Lower leaves turn yellow and senesce prematurely"
        ],
        "organic_treatments": [
            "Foliar spray of Bacillus subtilis bio-formulation @ 5ml/L",
            "Neem cake soil amendment @ 250 kg/ha to reduce soil-borne inoculum",
            "Panchagavya foliar spray (3%) to enhance systemic plant immunity"
        ],
        "chemical_controls": [
            "Mancozeb 75% WP (Indofil M-45) @ 2.5g/L water",
            "Chlorothalonil 75% WP (Kavach) @ 2g/L water",
            "Carbendazim 50% WP (Bavistin) @ 1g/L water"
        ],
        "prevention_tips": [
            "Rotate crops with Maize, Sorghum, or Pearl Millet for at least one full season",
            "Use certified disease-free seed treated with Trichoderma @ 10g/kg",
            "Maintain optimal field drainage to prevent waterlogging around root collar"
        ]
    },
    "Soybean_Mosaic_virus": {
        "disease_name": "Soybean Mosaic Virus (SMV)",
        "severity": "HIGH",
        "symptoms": [
            "Prominent mosaic pattern with alternating light and dark green blistered patches",
            "Severe leaf curling, puckering, and downward cupping of trifoliate leaves",
            "Stunted plant growth and mottled seed coat discoloration"
        ],
        "organic_treatments": [
            "Spray Neem oil @ 5ml/L to deter aphid vector colonization",
            "Install yellow sticky traps (15-20 traps/acre) to trap aphid vectors",
            "Immediately rogue out and destroy symptomatic plants to stop field spread"
        ],
        "chemical_controls": [
            "Vector Control: Thiamethoxam 25% WG @ 0.3g/L or Acetamiprid 20% SP @ 0.2g/L",
            "Imidacloprid 17.8% SL (Confidor) @ 0.5ml/L to control aphid vector population",
            "Note: Viral infections cannot be cured with fungicides; vector management is critical"
        ],
        "prevention_tips": [
            "Use certified virus-free breeder/foundation seeds",
            "Plant barrier border crops of maize or sorghum to trap incoming aphids",
            "Keep farm boundaries clean of wild legume weed hosts"
        ]
    },
    # Tomato
    "Tomato_Early_blight": {
        "disease_name": "Early Blight (Alternaria solani)",
        "severity": "HIGH",
        "symptoms": [
            "Circular brown-black lesions with concentric rings creating a 'target board' appearance",
            "Yellow chlorotic halo surrounds older leaf spots",
            "Stem lesions known as collar rot and sunken dark leathery rot at fruit stem end"
        ],
        "organic_treatments": [
            "Trichoderma viride foliar spray @ 5g/L with jaggery sticker",
            "Neem oil spray (10,000 ppm) @ 3ml/L every 7-10 days",
            "Prune and safely destroy lower leaves touching the ground surface"
        ],
        "chemical_controls": [
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L water",
            "Mancozeb 75% WP @ 2.5g/L preventive spray",
            "Chlorothalonil 75% WP (Kavach) @ 2g/L water"
        ],
        "prevention_tips": [
            "Stake tomato vines and mulch with silver-black polyethylene or clean straw",
            "Avoid splash irrigation; use precision drip fertigation",
            "Rotate Solanaceous crops with non-hosts (Gram, Maize, Onion) for 3 years"
        ]
    },
    "Tomato_Late_blight": {
        "disease_name": "Late Blight (Phytophthora infestans)",
        "severity": "HIGH",
        "symptoms": [
            "Water-soaked, dark olive green to brown irregular lesions appearing on leaves",
            "White frost-like downy fungal growth on leaf undersides during cool, moist mornings",
            "Rapid stem rot and greasy brown firm rot on green tomato fruit"
        ],
        "organic_treatments": [
            "Copper-based bio-spray (Bordeaux mixture 1%) during overcast weather",
            "Pseudomonas fluorescens foliar spray @ 5g/L",
            "Remove and incinerate blighted vines immediately"
        ],
        "chemical_controls": [
            "Cymoxanil 8% + Mancozeb 64% WP (Curzate) @ 2.5g/L (translaminar curative)",
            "Dimethomorph 50% WP (Acrobat) @ 1g/L + Mancozeb 2g/L",
            "Mandipropamid 23.4% SC (Revus) @ 1ml/L water"
        ],
        "prevention_tips": [
            "Monitor weather alerts for humidity > 90% and temperatures between 15-22°C",
            "Ensure wide spacing (60 x 45 cm) for prompt canopy drying",
            "Never compost diseased late-blight foliage"
        ]
    },
    "Tomato_Bacterial_spot": {
        "disease_name": "Bacterial Spot (Xanthomonas perforans / vesicatoria)",
        "severity": "HIGH",
        "symptoms": [
            "Small (less than 3mm), water-soaked angular dark brown lesions on foliage",
            "Centers of older leaf lesions frequently crack and drop out, creating a shot-hole look",
            "Raised blister-like scabby spots on green fruits with translucent margins"
        ],
        "organic_treatments": [
            "Foliar spray of Bacillus subtilis (1x10^9 CFU/g) @ 5g/L",
            "Seed treatment with hot water (50°C for 25 minutes) before sowing",
            "Copper hydroxide organic spray @ 2g/L"
        ],
        "chemical_controls": [
            "Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline (90:10) @ 0.1g/L (1g in 10L)",
            "Kasugamycin 3% SL @ 2ml/L water",
            "Avoid handling foliage when wet to avoid bacterial spreading"
        ],
        "prevention_tips": [
            "Purchase certified pathogen-free seeds and nursery transplants",
            "Sanitize pruning shears with 70% isopropyl alcohol between rows",
            "Sterilize nursery trays and seedling nursery beds with solarization"
        ]
    },
    "Tomato_Yellow_leaf_curl_virus": {
        "disease_name": "Tomato Leaf Curl Virus (ToLCV)",
        "severity": "HIGH",
        "symptoms": [
            "Severe upward curling and cupping of leaflets with yellow chlorotic margins",
            "Significant stunting of plant internodes producing a bushy stunted appearance",
            "Flower abortion resulting in severe or total yield loss"
        ],
        "organic_treatments": [
            "Install yellow sticky traps (25 traps/acre) to monitor and catch whitefly vectors",
            "Neem oil 10,000 ppm @ 4ml/L spray every 5 days during nursery and vegetative phase",
            "Spray cow milk + asafoetida (hing) solution to reduce viral symptom intensity"
        ],
        "chemical_controls": [
            "Whitefly vector control: Diafenthiuron 50% WP (Pegasus) @ 1.25g/L",
            "Spiromesifen 22.9% SC (Oberon) @ 1ml/L for whitefly nymph management",
            "Cyantraniliprole 10.26% OD (Benevia) @ 1.8ml/L at transplanting"
        ],
        "prevention_tips": [
            "Grow seedlings in 40-mesh insect-proof nylon net houses",
            "Grow border barrier crops of 3 rows of Maize or Sorghum around tomato plots",
            "Select ToLCV-tolerant hybrid cultivars (e.g. US-440, Abhinav, Arka Rakshak)"
        ]
    },
    # Rice
    "Rice_Leaf_Blast": {
        "disease_name": "Leaf Blast (Magnaporthe oryzae)",
        "severity": "HIGH",
        "symptoms": [
            "Spindle-shaped or eye-shaped lesions with greyish-white center and dark brown border",
            "Lesions enlarge rapidly and coalesce under overcast skies and high relative humidity",
            "Entire leaf blades dry out and wither, resembling severe burn damage"
        ],
        "organic_treatments": [
            "Pseudomonas fluorescens @ 5g/L foliar spray + seed treatment @ 10g/kg",
            "Spray silica / potassium silicate solution (2ml/L) to strengthen leaf epidermis",
            "Apply fermented butter-milk (chaas) @ 50ml/L as botanical antifungal"
        ],
        "chemical_controls": [
            "Tricyclazole 75% WP (Baan / Beam) @ 0.6g/L (gold standard for blast control)",
            "Isoprothiolane 40% EC (Fuji-one) @ 1.5ml/L",
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L"
        ],
        "prevention_tips": [
            "Avoid excessive split applications of urea or nitrogenous fertilizers",
            "Maintain proper standing water depth without drying out the soil completely",
            "Use certified blast-resistant paddy varieties (e.g. Indrayani, Phule Samruddhi)"
        ]
    },
    "Rice_Bacterial_leaf_blight": {
        "disease_name": "Bacterial Leaf Blight (Xanthomonas oryzae pv. oryzae)",
        "severity": "HIGH",
        "symptoms": [
            "Water-soaked stripes starting at leaf tips and margins, progressing downwards",
            "Wavy margins with straw-yellow to dirty white lesions",
            "Milky bacterial exudate droplets visible on leaf veins during early humid mornings"
        ],
        "organic_treatments": [
            "Foliar spray of fresh cow dung slurry filtrate (20%) at initial lesion appearance",
            "Seed treatment with Pseudomonas fluorescens @ 10g/kg seed",
            "Drain standing flood water for 2-3 days to break bacterial multiplication"
        ],
        "chemical_controls": [
            "Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.15g/L water",
            "Bismerthiazol (Klorocin) @ 2g/L",
            "Avoid applying nitrogen while bacterial lesions are actively expanding"
        ],
        "prevention_tips": [
            "Adopt alternate wetting and drying (AWD) water management",
            "Ensure field channels do not cross-contaminate adjacent paddy parcels",
            "Clip leaf tips only with disinfected cutters during seedling transplanting"
        ]
    },
    # Maize
    "Maize_Common_rust": {
        "disease_name": "Common Rust (Puccinia sorghi)",
        "severity": "MEDIUM",
        "symptoms": [
            "Golden-brown to cinnamon-brown powdery pustules on both upper and lower leaf surfaces",
            "Pustules rupture epidermal layers releasing abundant rusty-colored urediniospores",
            "Premature senescence of ear leaf reducing grain fill and cob weight"
        ],
        "organic_treatments": [
            "Trichoderma harzianum foliar application @ 5g/L",
            "Neem oil spray @ 3ml/L with mild detergent",
            "Apply wood ash dusting during calm morning dew"
        ],
        "chemical_controls": [
            "Mancozeb 75% WP @ 2.5g/L water",
            "Azoxystrobin 23% SC @ 1ml/L at tasseling stage",
            "Propiconazole 25% EC @ 1ml/L if rust reaches ear leaf before silking"
        ],
        "prevention_tips": [
            "Plant early in the season to evade peak rust spore showers",
            "Select rust-resistant hybrid maize cultivars (e.g. Pioneer, DKC, NK-6240)",
            "Destroy volunteer maize plants and alternative weed hosts like Oxalis"
        ]
    },
    "Maize_Northern_leaf_blight": {
        "disease_name": "Northern Corn Leaf Blight / Turcicum (Exserohilum turcicum)",
        "severity": "HIGH",
        "symptoms": [
            "Long elliptical, cigar-shaped grayish-green to tan necrotic lesions (3 to 15 cm long) extending parallel to leaf veins",
            "Lesions coalesce rapidly on lower and middle leaves, leading to extensive foliage firing and premature drying",
            "Under humid overcast conditions, dark olive-black fungal sporulation appears in lesion centers"
        ],
        "organic_treatments": [
            "Foliar bio-control spray of Trichoderma harzianum or Pseudomonas fluorescens @ 5g/L",
            "Neem Seed Kernel Extract (NSKE 5%) or 10,000 ppm cold-pressed Neem Oil @ 3ml/L",
            "Soil application of Trichoderma-enriched organic farmyard manure (FYM) @ 250 kg/acre"
        ],
        "chemical_controls": [
            "Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top) @ 1ml/L water (protective & curative)",
            "Mancozeb 75% WP (Indofil M-45) @ 2.5g/L water at first appearance of cigar lesions",
            "Pyraclostrobin 20% WG @ 1g/L water with a 15-day pre-harvest interval"
        ],
        "prevention_tips": [
            "Rotate crops for at least 1-2 years with non-graminaceous crops (Soybean, Chickpea, or Groundnut)",
            "Adopt deep summer plowing to bury infected crop residue and destroy overwintering fungal mycelium",
            "Select certified blight-tolerant hybrid maize cultivars (e.g. Pioneer 3396, DKC 9108, PAC 740)"
        ]
    },
    "Maize_Gray_leaf_spot": {
        "disease_name": "Gray Leaf Spot (Cercospora zeae-maydis)",
        "severity": "HIGH",
        "symptoms": [
            "Small rectangular, tan to gray lesions strictly restricted between leaf veins",
            "Lesions expand linearly into long rectangular blocks that turn grayish brown",
            "Severe canopy blight resulting in premature stalk lodging and reduced grain fill"
        ],
        "organic_treatments": [
            "Foliar bio-agent application of Bacillus subtilis @ 5ml/L water",
            "Panchagavya (3%) foliar spray to boost systemic foliar vigor",
            "Prompt removal and deep burial of heavily blighted lower leaves"
        ],
        "chemical_controls": [
            "Azoxystrobin 23% SC @ 1ml/L water",
            "Propiconazole 25% EC (Tilt) @ 1ml/L water",
            "Chlorothalonil 75% WP @ 2g/L preventive spray"
        ],
        "prevention_tips": [
            "Ensure 60cm row spacing to facilitate canopy ventilation and quick dew drying",
            "Avoid planting continuous maize in zero-till fields with heavy crop stubble",
            "Apply balanced potassium (K) nutrition to enhance leaf tissue toughness"
        ]
    },
    # Potato
    "Potato_Late_blight": {
        "disease_name": "Late Blight (Phytophthora infestans)",
        "severity": "HIGH",
        "symptoms": [
            "Water-soaked irregular blackish-brown lesions rapidly spreading from leaf tips",
            "White fungal mildew halo visible on leaf undersurface during early morning mist",
            "Stem collar rot and dry granular reddish-brown rot inside potato tubers"
        ],
        "organic_treatments": [
            "Bordeaux mixture (1%) preventive foliar coverage",
            "Bio-fungicide spray of Trichoderma viride @ 5g/L",
            "Earthing-up tubers with deep soil cover (at least 10 cm) to block wash-down zoospores"
        ],
        "chemical_controls": [
            "Dimethomorph 50% WP (Acrobat) @ 1.5g/L + Mancozeb 75% WP @ 2g/L",
            "Cymoxanil 8% + Mancozeb 64% WP @ 2.5g/L curative spray",
            "Metalaxyl-M 4% + Mancozeb 64% WP @ 2.5g/L"
        ],
        "prevention_tips": [
            "Use certified disease-free seed tubers treated with Mancozeb @ 3g/kg",
            "De-haulm (cut and remove potato foliage) 10 days prior to harvest",
            "Store harvested tubers only after curing in a dry, ventilated shed"
        ]
    },
    # Sugarcane
    "Sugarcane_Red_rot": {
        "disease_name": "Red Rot (Colletotrichum falcatum)",
        "severity": "HIGH",
        "symptoms": [
            "Third or fourth leaf from crown shows yellowing, withering, and drying along margins",
            "Midrib of leaves exhibits dark reddish lesions with white centers",
            "Internal cane stalk shows longitudinal red discoloration interrupted by white transverse patches"
        ],
        "organic_treatments": [
            "Sett treatment with Trichoderma viride @ 10g/L water before planting",
            "Apply bio-agent enriched vermicompost in planting furrows",
            "Uproot and burn diseased clumps including root stools"
        ],
        "chemical_controls": [
            "Sett dipping in Carbendazim 50% WP @ 1g/L for 15-20 minutes",
            "Foliar spray of Thiophanate Methyl 70% WP @ 1.5g/L on seed cane nursery",
            "Soil drenching around root zone with Copper Oxychloride @ 3g/L"
        ],
        "prevention_tips": [
            "Plant only certified red-rot free seed sets (Co 86032, VSI 08005)",
            "Adopt hot water sett treatment (52°C for 30 minutes) at nursery level",
            "Avoid ratoon cultivation in fields where red rot incidence exceeded 5%"
        ]
    },
    # Grape
    "Grape_Downy_mildew": {
        "disease_name": "Downy Mildew (Plasmopara viticola)",
        "severity": "HIGH",
        "symptoms": [
            "Yellowish oily translucent 'oil spots' on upper surface of grape leaves",
            "White dense downy cottony growth on the corresponding underside in high humidity",
            "Infected berry clusters turn brown, shrivel, and become hard 'leather berries'"
        ],
        "organic_treatments": [
            "Bordeaux mixture (0.8% - 1%) preventive foliar coverage",
            "Bio-control foliar spray of Ampelomyces quisqualis or Trichoderma @ 5g/L",
            "Canopy shoot thinning to maximize sunshine penetration and air circulation"
        ],
        "chemical_controls": [
            "Dimethomorph 50% WP @ 1g/L or Mandipropamid 23.4% SC @ 0.8ml/L",
            "Potassium Phosphite (40%) @ 3ml/L (systemic acquired resistance booster)",
            "Metiram 55% + Pyraclostrobin 5% WG (Cabrio Top) @ 2g/L"
        ],
        "prevention_tips": [
            "Maintain trellis architecture to keep grape bunches off the ground",
            "Apply protective fungicide sprays prior to anticipated rainfall events",
            "Remove and incinerate all mummified grape clusters and fallen autumn leaves"
        ]
    },
    # Generic Healthy profile
    "Healthy": {
        "disease_name": "Healthy Specimen (No Active Pathogen Detected)",
        "severity": "LOW",
        "symptoms": [
            "Vibrant green, uniform leaf lamina without chlorosis, necrosis, or lesions",
            "Normal turgidity and intact stomatal leaf margins",
            "Optimal physiological photosynthetic capacity with no fungal downy or bacterial exudate"
        ],
        "organic_treatments": [
            "Maintain routine bi-weekly foliar nutrition with Panchagavya (3%) or Seaweed extract @ 2ml/L",
            "Apply prophylactic neem oil spray (3,000 ppm) @ 2ml/L to deter sap-sucking pests",
            "Apply balanced compost or Jeevamrutha to nurture rhizosphere microbiome"
        ],
        "chemical_controls": [
            "No chemical fungicides or bactericides required for healthy plants",
            "Optional preventive bio-protectant: Pseudomonas fluorescens @ 5g/L",
            "Maintain balanced NPK fertigation schedule based on crop growth phase"
        ],
        "prevention_tips": [
            "Continue regular weekly canopy scouting on leaf undersides",
            "Ensure micro-irrigation emitters are clog-free and delivering uniform moisture",
            "Keep soil mulch intact to maintain cool root temperatures and suppress weeds"
        ]
    }
}

def get_agronomic_guidance(crop_name: str, disease_raw_label: str) -> Dict[str, Any]:
    """Retrieves agronomic guidance for a disease, falling back gracefully to robust agronomy heuristics."""
    clean_label = disease_raw_label.replace(" ", "_").strip()
    is_healthy = "healthy" in clean_label.lower()

    if is_healthy:
        base = AGRONOMIC_KNOWLEDGE["Healthy"].copy()
        base["disease_name"] = f"Healthy {crop_name} Leaf (Physiologically Normal)"
        base["is_healthy"] = True
        base["severity"] = "LOW"
        base["disclaimer"] = "Specimen shows normal cellular development with no significant foliar necrosis. Continue standard agronomic scouting."
        return base

    # Try exact match
    lookup_key = f"{crop_name}_{clean_label}"
    for k, v in AGRONOMIC_KNOWLEDGE.items():
        if k.lower() == lookup_key.lower():
            res = v.copy()
            res["is_healthy"] = False
            res["disclaimer"] = "AI agronomic detection via ConvNeXt neural leaf analysis. Always cross-verify with your local Krishi Vigyan Kendra (KVK) or Taluka Agriculture Officer before mass pesticide applications."
            return res

    # Try partial matching on disease keywords
    disease_friendly = disease_raw_label.replace("_", " ").title()
    d_lower = disease_friendly.lower()

    for k, v in AGRONOMIC_KNOWLEDGE.items():
        if k == "Healthy":
            continue
        k_lower = k.lower()
        if any(term in d_lower for term in ["rust", "mildew", "blight", "spot", "virus", "rot", "canker", "scab"]):
            matched_terms = [t for t in ["rust", "mildew", "blight", "spot", "virus", "rot", "canker", "scab"] if t in d_lower and t in k_lower]
            if matched_terms:
                res = v.copy()
                res["disease_name"] = f"{crop_name} {disease_friendly}"
                res["is_healthy"] = False
                res["disclaimer"] = "AI agronomic detection via ConvNeXt neural leaf analysis. Always cross-verify with your local Krishi Vigyan Kendra (KVK) or Taluka Agriculture Officer before mass pesticide applications."
                return res

    # General agronomic guidance fallback
    severity = "HIGH" if any(x in d_lower for x in ["blight", "rust", "wilt", "rot", "virus"]) else "MEDIUM"
    return {
        "disease_name": f"{crop_name} {disease_friendly}",
        "is_healthy": False,
        "severity": severity,
        "symptoms": [
            f"Foliar lesions and symptom patterns consistent with {disease_friendly} on leaf lamina",
            "Chlorotic yellowing and localized necrotic cellular breakdown",
            "Compromised stomatal transpiration and photosynthetic efficiency"
        ],
        "organic_treatments": [
            "Foliar bio-control spray of Trichoderma harzianum or Pseudomonas fluorescens @ 5g/L",
            "Neem Seed Kernel Extract (NSKE 5%) or 10,000 ppm cold-pressed neem oil @ 3ml/L",
            "Prompt roguing and sanitation of heavily infested foliage"
        ],
        "chemical_controls": [
            "Broad-spectrum fungicide: Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L water",
            "Systemic curative: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L water",
            "Adhere strictly to labeled CIBRC dosage and protective application safety gear"
        ],
        "prevention_tips": [
            "Maintain optimal row-to-row spacing for canopy aeration",
            "Switch to precision drip irrigation to prevent splash-dispersal of fungal spores",
            "Adopt crop rotation with non-host species for consecutive seasons"
        ],
        "disclaimer": "AI agronomic detection via ConvNeXt neural leaf analysis. Always cross-verify with your local Krishi Vigyan Kendra (KVK) or Taluka Agriculture Officer before mass pesticide applications."
    }

def check_plant_specimen(
    pil_img: Image.Image,
    img_tensor: torch.Tensor,
    detector_model: torch.nn.Module
) -> Tuple[bool, Optional[str], float]:
    """
    Dual-layer validation gate to detect Out-Of-Distribution / Non-Crop images
    (animals, pets, humans, vehicles, furniture, or non-botanical objects).
    """
    arr = np.array(pil_img.convert("RGB")).astype(np.float32)
    R, G, B = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # 1. Botanical foliage pigment analysis (Excess Green + chlorotic/necrotic foliar gamut)
    exg = 2 * G - R - B
    botanical_mask = (exg > 8) | ((R > 55) & (G > 45) & (G > B + 8))
    botanical_ratio = float(np.mean(botanical_mask))
    
    # 2. ConvNeXt 36-Crop Detector activations
    with torch.no_grad():
        det_logits = detector_model(img_tensor)
        det_probs = torch.softmax(det_logits, dim=-1)[0]
        top_prob = float(torch.max(det_probs).item()) * 100
        max_logit = float(torch.max(det_logits).item())
        entropy = float(-torch.sum(det_probs * torch.log(det_probs + 1e-9)).item())
        
    # Validation decision
    if botanical_ratio < 0.12:
        return False, f"Specimen lacks agricultural vegetative pigments (foliage coverage: {botanical_ratio:.1%}).", top_prob
    if top_prob < 40.0 and max_logit < 3.8:
        return False, f"Visual pattern does not exhibit crop foliage features (confidence: {top_prob:.1f}%, logit: {max_logit:.2f}).", top_prob
    if entropy > 2.05 and top_prob < 52.0:
        return False, f"High neural distribution ambiguity (entropy: {entropy:.2f}).", top_prob
        
    return True, None, top_prob

def diagnose_leaf(
    image_input: Any,
    crop_requested: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main disease diagnosis pipeline using HuggingFace 'ixrbhii/multicrop-disease-models':
    1. Preprocesses image to [1, 3, 224, 224] tensor and PIL image.
    2. Validates that the specimen is an agricultural crop (rejects animals, humans, vehicles, everyday objects).
    3. Identifies crop species if 'auto'.
    4. Loads specific crop model and evaluates disease diagnosis.
    """
    # 1. Preprocess
    img_tensor, pil_img = preprocess_image(image_input)

    # 2. Load 36-Crop Detector Model (serves as specimen gatekeeper and crop resolver)
    detector_model, detector_cfg = load_crop_model("detectors/new")
    
    # 3. Specimen Validation Gate
    is_plant, reject_reason, top_det_prob = check_plant_specimen(pil_img, img_tensor, detector_model)
    if not is_plant:
        return {
            "is_plant": False,
            "crop_detected": "Non-Plant / Irrelevant Specimen",
            "crop_key": None,
            "detector_confidence_pct": round(top_det_prob, 1),
            "disease_name": "No Crop Foliage Detected",
            "raw_prediction": "non_plant",
            "is_healthy": False,
            "confidence_pct": 0.0,
            "status": "NON_PLANT_IMAGE",
            "severity": "LOW",
            "top_candidates": [],
            "warning_title": "Non-Plant / Irrelevant Image Detected",
            "warning_message": "The uploaded photograph does not appear to be an agricultural crop or plant leaf specimen. Our neural vision analysis detected non-crop features (e.g. animal, human, or everyday object).",
            "guidance_tip": "Please upload a clear photograph of an actual crop leaf, stalk, or affected plant canopy so our AI agronomist can accurately diagnose plant health.",
            "clinical_symptoms": [
                "No characteristic leaf mesophyll, venation, or foliar tissue observed in the image",
                "Spectral pigments and surface textures deviate from agricultural crop leaf profiles"
            ],
            "organic_treatments": [],
            "chemical_controls": [],
            "prevention_tips": [
                "Position the camera 10–20 cm from the affected plant leaf for close-up inspection",
                "Ensure adequate ambient natural lighting without harsh reflections or darkness",
                "Ensure the specimen in frame is an agricultural crop (e.g. Maize, Soybean, Tomato, Rice, Sugarcane)"
            ],
            "disclaimer": "AI plant health diagnostic requires an agricultural botanical specimen. Upload a clear plant or leaf photograph.",
            "model_architecture": "convnext_small",
            "model_source": "AgriHub Specimen Verification Gate",
        }

    # 4. Resolve crop
    resolved_crop_key = get_normalized_crop_key(crop_requested)
    detected_crop_name = None
    detector_confidence = None

    if not resolved_crop_key:
        with torch.no_grad():
            det_logits = detector_model(img_tensor)
            det_probs = torch.softmax(det_logits, dim=-1)[0]
            top_det_idx = torch.argmax(det_probs).item()
            detector_classes = detector_cfg.get("classes", [])
            detected_crop_raw = detector_classes[top_det_idx]
            detector_confidence = round(float(det_probs[top_det_idx].item()) * 100, 1)

        resolved_crop_key = get_normalized_crop_key(detected_crop_raw) or "Soybean"
        detected_crop_name = CROP_DISPLAY_NAMES.get(resolved_crop_key, detected_crop_raw.replace("_", " "))
    else:
        detected_crop_name = CROP_DISPLAY_NAMES.get(resolved_crop_key, resolved_crop_key.replace("_", " "))

    # 3. Run Disease Model for this Crop
    model, config = load_crop_model(resolved_crop_key)
    with torch.no_grad():
        logits = model(img_tensor)
        probs = torch.softmax(logits, dim=-1)[0]

    classes = config.get("classes", [])
    labels = config.get("labels", [c.replace("_", " ") for c in classes])

    # Rank predictions
    ranked_indices = torch.argsort(probs, descending=True).tolist()
    top_idx = ranked_indices[0]
    top_raw_class = classes[top_idx]
    top_label = labels[top_idx]
    confidence_pct = round(float(probs[top_idx].item()) * 100, 1)

    # Top differential candidates
    top_candidates = []
    for idx in ranked_indices[:4]:
        top_candidates.append({
            "class_name": labels[idx],
            "raw_class": classes[idx],
            "probability_pct": round(float(probs[idx].item()) * 100, 1)
        })

    # 4. Certainty calibration
    if confidence_pct >= 70.0:
        status = "CONFIRMED"
    elif confidence_pct >= 40.0:
        status = "UNCERTAIN"
    else:
        status = "LOW_QUALITY_IMAGE"

    # 5. Agronomic knowledge
    guidance = get_agronomic_guidance(resolved_crop_key, top_raw_class)

    return {
        "crop_detected": detected_crop_name,
        "crop_key": resolved_crop_key,
        "detector_confidence_pct": detector_confidence,
        "disease_name": guidance["disease_name"],
        "raw_prediction": top_raw_class,
        "is_healthy": guidance["is_healthy"],
        "confidence_pct": confidence_pct,
        "status": status,
        "severity": guidance["severity"],
        "top_candidates": top_candidates,
        "clinical_symptoms": guidance["symptoms"],
        "organic_treatments": guidance["organic_treatments"],
        "chemical_controls": guidance["chemical_controls"],
        "prevention_tips": guidance["prevention_tips"],
        "disclaimer": guidance["disclaimer"],
        "model_architecture": config.get("arch", "convnext_small"),
        "model_source": f"HuggingFace: {REPO_ID}/{resolved_crop_key}",
    }

if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="AgriHub HuggingFace ConvNeXt Crop Disease Inference Engine")
    parser.add_argument("--image", type=str, required=True, help="Image file path or base64 string")
    parser.add_argument("--crop", type=str, default="auto", help="Crop species (Soybean, Tomato, Rice, Maize, etc. or 'auto')")
    args = parser.parse_args()

    result = diagnose_leaf(args.image, args.crop)
    print(json.dumps(result, indent=2))
