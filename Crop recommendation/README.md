# 🌾 AgriHub Baramati Regional Crop Recommendation Engine & Prediction API

> **Specialized Agricultural AI Service for Baramati Taluka, Pune District, Maharashtra**  
> Grounded in verified trials from **ICAR–National Institute of Abiotic Stress Management (NIASM)** and **Krishi Vigyan Kendra (KVK), Baramati**.  
> Delivers ranked Top-3 recommendations with certified KVK seed varieties, abiotic stress management alerts, water feasibility gating, and missing soil lab test tolerance.

---

## 🏛️ Research Grounding & Verified Datasets

All generic, state-wide, and unverified Kaggle datasets were removed. The engine is trained and calibrated strictly against verified agricultural research datasets from Baramati institutions:

1. **ICAR–NIASM (National Institute of Abiotic Stress Management), Malegaon Khurd, Baramati**:
   - Field experiment datasets on water stress, heat stress, shallow basaltic murrum physics, and deficit irrigation resilience.
2. **Krishi Vigyan Kendra (KVK), Baramati (Shardanagar)**:
   - Yield demonstrations, weather station climate records (temperature, humidity, precipitation patterns), and certified seed varieties (`Co 86032 (Nira)`, `Phule Sangam`, `Maldandi M 35-1`, `Bhima Super`, `Phule Samadhan`, `Phule Vikram`, `African Tall`, `Dhanashakti`).
3. **Maharashtra State Data Bank (Baramati Taluka Statistics)**:
   - Microzone irrigation commands: Nira Left Bank Canal command, well/borewell aquifer systems, and rainfed scarcity belts.

---

## 🗺️ Baramati Microzones & Soil Types

The engine recognizes 3 distinct agro-ecological microzones in Baramati Taluka, with automatic village inference:

| Microzone | Key Villages | Dominant Soil | Primary Water System | Typical Cropping Pattern |
|:---|:---|:---|:---|:---|
| **Canal Command (`canal_command`)** | Malegaon, Pandare, Songaon, Bhavaninagar, Dorlewadi | Deep Black Vertisol | Nira Left Bank Canal, River Lift | Adsali/Suru Sugarcane, Rabi Wheat, Onion |
| **Well Irrigated (`well_irrigated`)** | Shardanagar, Jalochi, Kashti, Rui, Shirsuphal | Medium Clay Loam | Dug well, Borewell + Drip/Sprinkler | Soybean, Hybrid Maize, Rabi Chickpea, Onion |
| **Rainfed Scarcity (`rainfed_scarcity`)** | Supa, Morgaon, Khandaj, Anjangaon | Shallow Murrum | Scarcity Rainfed (450–550 mm) | Maldandi Rabi Jowar (M 35-1), Bajra, Gram |

---

## 🚀 Quick Start for Backend & Frontend Integration

### 1. Run the Prediction API
```bash
cd agrihub-ml
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger API documentation is available at:
**`http://localhost:8000/docs`**

### 2. Live Interactive Test Bench (HTML Demo)
To visually test predictions with pre-loaded Baramati village presets:
- Visit **`http://localhost:8000/demo`** in your browser, or
- Open `demo.html` directly in any web browser.

### 3. CLI Prediction Tester
Test realistic Baramati agricultural scenarios from the terminal:
```bash
# Test Scenario 1: Malegaon Canal Sugarcane
python test_prediction_cli.py 1

# Test Scenario 2: Shardanagar KVK Farm Soybean
python test_prediction_cli.py 2

# Test Scenario 3: Supa Rainfed Scarcity Maldandi Jowar
python test_prediction_cli.py 3
```

### 4. API Key Authentication
All recommendation endpoints require header-based authentication:
- **Header Name:** `X-API-Key`
- **Default Key:** `agrihub-prod-key-2026` *(Configurable via environment variable)*

---

## 📡 API Endpoints Reference

### 1. `POST /api/v1/recommend`
Generates ranked Top-3 recommendations with KVK seed varieties, agronomic reasons, water feasibility, and abiotic stress trade-offs.

#### Example Request: Malegaon Canal Sugarcane Plot
```json
{
  "village": "Malegaon",
  "microzone": "canal_command",
  "soil_type": "deep_black_vertisol",
  "season": "annual",
  "farm_area_acres": 4.0,
  "irrigation_source": "canal",
  "water_availability": "high",
  "seasonal_water_reliability": "reliable",
  "irrigation_method": "drip",
  "previous_crop": "sugarcane"
}
```

#### Example Request: Minimal (No Soil Lab Test Available)
The service automatically uses Baramati microzone priors and missing-indicator pipeline flags:
```json
{
  "village": "Supa",
  "season": "rabi",
  "irrigation_source": "rainfed",
  "water_availability": "low",
  "seasonal_water_reliability": "unreliable",
  "irrigation_method": "rainfed"
}
```

#### Example Response Output
```json
{
  "status": "success",
  "model_version": "agrihub-baramati-v2.0.0",
  "timestamp": "2026-09-04T22:20:00",
  "farmer_summary": {
    "region": "Baramati, Pune District",
    "village_circle": "Malegaon",
    "microzone": "Canal Command",
    "soil_type": "Deep Black Vertisol",
    "season": "Annual",
    "farm_area_acres": 4.0,
    "irrigation": "Canal (Drip)",
    "water_availability": "High",
    "seasonal_water_reliability": "Reliable"
  },
  "soil_test_status": "Baramati Micro-Zone Default (No Lab Test Provided; Handled via Missing Indicator Pipeline)",
  "recommendations": [
    {
      "rank": 1,
      "crop": "sugarcane",
      "crop_name": "Sugarcane",
      "marathi_name": "ऊस",
      "kvk_varieties": ["Co 86032 (Nira)", "VSI 08005", "MS 10001"],
      "final_score": 0.7128,
      "confidence_pct": 71.3,
      "agronomic_score": 0.2600,
      "regional_score": 0.9500,
      "water_feasibility_score": 0.9500,
      "preference_score": 0.7000,
      "reasons": [
        "Strong soil & climate affinity (26.0% ML model suitability).",
        "Naturally suited to Baramati Deep Black Vertisol conditions.",
        "Assured canal irrigation and reliable water supply satisfies high crop water demand."
      ],
      "tradeoffs": [
        "Requires continuous irrigation scheduling across 300+ days; KVK recommends drip automation to prevent soil salinity.",
        "Requires 1800-2500 mm perennial water; strictly unviable in rainfed Supa/scarcity zones."
      ],
      "water_requirement": "very_high",
      "water_requirement_mm": [1800.0, 2500.0],
      "duration_days": [300, 365],
      "drought_tolerance": "low",
      "management_commitment": "high",
      "regional_status": "Highly Suitable in Baramati Canal Command (Annual: 96.0% historical presence, 115.0 T/Ha avg yield)"
    }
  ]
}
```

### 2. `GET /api/v1/crops`
Returns all 8 Baramati crops with KVK-recommended varieties and agronomic attributes.

### 3. `GET /api/v1/microzones`
Returns the 3 Baramati microzones, list of villages mapped to each, and historical crop distribution.

### 4. `GET /api/v1/metadata`
Returns active model version, test accuracy (**95.43%**), top-3 accuracy (**100.00%**), and ICAR-NIASM / KVK citations.

---

## 💻 Frontend / Backend Code Integration Examples

### Node.js / Next.js / Express
```javascript
const axios = require('axios');

async function getBaramatiRecommendations(plotData) {
  try {
    const response = await axios.post(
      'http://localhost:8000/api/v1/recommend',
      plotData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.AGRIHUB_API_KEY || 'agrihub-prod-key-2026'
        }
      }
    );
    return response.data.recommendations;
  } catch (error) {
    console.error('AgriHub Error:', error.response?.data || error.message);
    throw error;
  }
}
```

### Python (Django / Flask / FastAPI)
```python
import requests

def fetch_baramati_recommendations(plot_payload: dict):
    url = "http://localhost:8000/api/v1/recommend"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "agrihub-prod-key-2026"
    }
    resp = requests.post(url, json=plot_payload, headers=headers, timeout=5)
    resp.raise_for_status()
    return resp.json()["recommendations"]
```

---

## 🧠 Multi-Factor Recommendation Architecture

$$\text{Final Score} = 0.50 \cdot S_{\text{agro}} + 0.20 \cdot S_{\text{reg}} + 0.20 \cdot S_{\text{water}} + 0.10 \cdot S_{\text{pref}}$$

1. **Agronomic Model ($S_{\text{agro}}$)**:
   - Scikit-Learn Pipeline (`SimpleImputer(add_indicator=True)`, `StandardScaler`, `OneHotEncoder`, `RandomForestClassifier`).
   - Evaluates soil chemistry, weather, and microzone compatibility.
   - **Metrics:** Test Accuracy: **95.43%**, Top-3 Accuracy: **100.00%**, Macro F1: **95.32%**.
2. **Microzone Regional Suitability ($S_{\text{reg}}$)**:
   - Tailored to Baramati's 3 microzones using ICAR-NIASM and KVK demonstrative presence records.
3. **Water Feasibility Layer ($S_{\text{water}}$)**:
   - Evaluates effective root-zone moisture (natural rain + canal/river irrigation allowance).
   - Enforces strict feasibility gating: Perennial sugarcane in low-water/rainfed setups receives an immediate gating penalty to protect farmers from catastrophic drought failure.
4. **Farmer Agronomic Preference ($S_{\text{pref}}$)**:
   - Awards bonus for legume rotation (Soybean/Chickpea after cereals).
   - In canal zones with continuous water, respects established sugarcane infrastructure (Ratoon/खोदवा management).

---

## 🧪 Testing on New Data

You can test the trained model on new data using multiple methods:

### Method 1: Batch Testing from a New CSV File
If you have a new CSV file containing field observations or farmer plots:
```bash
python test_on_new_data.py --csv path/to/your_new_data.csv
```
- **Automatic Predictions**: Generates Top-3 recommendations, confidence scores, and certified KVK varieties for each row.
- **Accuracy Evaluation**: If the CSV contains a `crop` or `label` ground truth column, it automatically computes **Top-1 Accuracy** and **Top-3 Accuracy**.
- **Saved Output**: Exports a new file `your_new_data_predicted.csv` containing all input data alongside the model's predictions.

### Method 2: Interactive Terminal Mode (Single New Plot)
Test any new farmer plot by answering terminal prompts:
```bash
python test_on_new_data.py --interactive
```
Prompt:
- Baramati Village (e.g. *Malegaon, Shardanagar, Supa, Pandare*)
- Season (*kharif / rabi / annual*)
- Soil Type (*deep_black_vertisol / medium_clay_loam / shallow_murrum*)
- Water Availability (*high / medium / low*)
- Irrigation Source (*canal / borewell / open_well / river / rainfed*)
- Soil Lab Test N-P-K (optional `y/n`)

### Method 3: Direct Command-Line Arguments
```bash
python test_on_new_data.py --village Malegaon --soil deep_black_vertisol --season annual --water high --irrigation canal
```

### Method 4: Visual Web Interface (In Your Browser)
Open **`http://localhost:8000/demo`**
- Adjust any slider, dropdown, or custom soil N-P-K value.
- Click **"Generate Top 3 Recommendations"** to see instant predictions, confidence meters, and KVK varieties.

### Method 5: Direct Python Code
```python
import requests

payload = {
    "village": "Malegaon",
    "soil_type": "deep_black_vertisol",
    "season": "annual",
    "irrigation_source": "canal",
    "water_availability": "high"
}

resp = requests.post(
    "http://localhost:8000/api/v1/recommend",
    json=payload,
    headers={"X-API-Key": "agrihub-prod-key-2026"}
)
print(resp.json()["recommendations"])
```

### Method 6: Automated Test Suite & Accuracy Evaluation
```bash
# Run 7 automated production scenario tests:
pytest agrihub-ml/tests/test_scenarios.py -v

# Run statistical evaluation on test data split:
python evaluate_accuracy.py
```

---

## 📁 Project Structure & Files Reference

- **`train_and_export.py`**: Model training script on ICAR-NIASM and KVK Baramati datasets with 150-estimator Random Forest and missing-indicator pipeline.
- **`evaluate_accuracy.py`**: Model evaluation tool (Top-1, Top-3 accuracy, macro metrics, and classification report).
- **`test_prediction_cli.py`**: Terminal-based scenario tester for Malegaon, Shardanagar, Supa, Pandare, and Songaon.
- **`test_on_new_data.py`**: Batch CSV testing and interactive plot tester for new field data.
- **`demo.html`**: Standalone web UI for interactive visual testing.
- **`artifacts/crop_model.joblib`**: Serialized production Scikit-Learn pipeline.
- **`artifacts/crop_profiles.json`**: Baramati crops with KVK varieties and ICAR stress alerts.
- **`artifacts/baramati_microzones.json`**: Microzone definitions, village mappings, and soils.
- **`artifacts/regional_scores.json`**: Microzone-indexed suitability scores.
- **`artifacts/model_metadata.json`**: Performance logs, versioning, and research citations.
- **`data/processed/baramati_agronomic_dataset.csv`**: 1,640 verified research observations across 8 Baramati crops.
- **`agrihub-ml/`**: Production FastAPI microservice directory.


