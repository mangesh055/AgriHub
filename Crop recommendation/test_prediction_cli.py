import sys
import json
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000/api/v1/recommend"
API_KEY = "agrihub-prod-key-2026"

SCENARIOS = {
    "1": {
        "title": "Malegaon (Canal Command, Nira Left Bank Canal) - Sugarcane (Co 86032) Test",
        "payload": {
            "village": "Malegaon", "microzone": "canal_command", "soil_type": "deep_black_vertisol",
            "season": "annual", "farm_area_acres": 4.0, "irrigation_source": "canal",
            "water_availability": "high", "seasonal_water_reliability": "reliable",
            "irrigation_method": "drip", "previous_crop": "sugarcane"
        }
    },
    "2": {
        "title": "Shardanagar (KVK Farm Belt, Borewell + Drip) - Soybean (Phule Sangam) Test",
        "payload": {
            "village": "Shardanagar", "microzone": "well_irrigated", "soil_type": "medium_clay_loam",
            "season": "kharif", "farm_area_acres": 3.0, "irrigation_source": "borewell",
            "water_availability": "medium", "seasonal_water_reliability": "reliable",
            "irrigation_method": "drip", "previous_crop": "wheat"
        }
    },
    "3": {
        "title": "Supa (Rainfed Scarcity, Shallow Murrum) - Maldandi Rabi Jowar (M 35-1) Test",
        "payload": {
            "village": "Supa", "microzone": "rainfed_scarcity", "soil_type": "shallow_murrum",
            "season": "rabi", "farm_area_acres": 4.0, "irrigation_source": "rainfed",
            "water_availability": "low", "seasonal_water_reliability": "unreliable",
            "irrigation_method": "rainfed", "previous_crop": "fallow"
        }
    },
    "4": {
        "title": "Pandare (Canal Command, Winter Season) - Rabi Wheat (Phule Samadhan) & Onion Test",
        "payload": {
            "village": "Pandare", "microzone": "canal_command", "soil_type": "medium_clay_loam",
            "season": "rabi", "farm_area_acres": 3.0, "irrigation_source": "canal",
            "water_availability": "medium", "seasonal_water_reliability": "reliable",
            "irrigation_method": "drip", "previous_crop": "soybean"
        }
    },
    "5": {
        "title": "Songaon (Dairy Belt, Well Irrigated) - African Tall Maize Fodder Test",
        "payload": {
            "village": "Songaon", "microzone": "well_irrigated", "soil_type": "deep_black_vertisol",
            "season": "kharif", "farm_area_acres": 2.5, "irrigation_source": "borewell",
            "water_availability": "medium", "seasonal_water_reliability": "reliable",
            "irrigation_method": "sprinkler", "previous_crop": "sugarcane"
        }
    }
}

def query_prediction(payload):
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        }
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def display_results(data):
    print("\n" + "=" * 75)
    print("AGRIHUB BARAMATI CROP RECOMMENDATION RESULTS")
    print("Research Centers: ICAR-NIASM & KVK Baramati")
    print("=" * 75)
    fs = data.get("farmer_summary", {})
    print(f"Location:      Village: {fs.get('village_circle')}, {fs.get('region')} | Zone: {fs.get('microzone')}")
    print(f"Plot Context:  Soil: {fs.get('soil_type')} | Season: {fs.get('season')} | Area: {fs.get('farm_area_acres')} Acres")
    print(f"Water Setup:   {fs.get('irrigation')} | Availability: {fs.get('water_availability')} ({fs.get('seasonal_water_reliability')})")
    print(f"Soil Status:   {data.get('soil_test_status')}")
    print("-" * 75)

    for rec in data.get("recommendations", []):
        rank = rec.get("rank")
        crop = rec.get("crop_name")
        marathi = rec.get("marathi_name", "")
        vars_list = rec.get("kvk_varieties", [])
        conf = rec.get("confidence_pct")
        final_score = rec.get("final_score")
        agro_score = rec.get("agronomic_score")
        reg_score = rec.get("regional_score")
        water_score = rec.get("water_feasibility_score")
        dur = rec.get("duration_days")
        water_req = rec.get("water_requirement")

        print(f"\n[RANK #{rank}] {crop} ({marathi})")
        if vars_list:
            print(f"  KVK Varieties: {', '.join(vars_list)}")
        print(f"  Confidence:    {conf}% (Composite Score: {final_score:.4f})")
        print(f"  Scores:        Agronomic: {agro_score*100:.1f}% | Regional Zone: {reg_score*100:.1f}% | Water Feasibility: {water_score*100:.1f}%")
        print(f"  Crop Profile:  Water Need: {water_req.upper()} | Duration: {dur[0]}-{dur[1]} days | Drought Tol: {rec.get('drought_tolerance')}")
        print(f"  Zone Status:   {rec.get('regional_status')}")
        print("  Why Recommended:")
        for r in rec.get("reasons", [])[:2]:
            print(f"    + {r}")
        if rec.get("tradeoffs"):
            print("  Management Trade-Offs & Alerts:")
            for t in rec.get("tradeoffs", [])[:2]:
                print(f"    ! {t}")

    print("\n" + "=" * 75)

def main():
    print("\n" + "=" * 75)
    print("AGRIHUB BARAMATI CLI PREDICTION TESTER")
    print("=" * 75)
    print("Select a Baramati scenario to test (1-5):")
    for k, v in SCENARIOS.items():
        print(f"  [{k}] {v['title']}")

    choice = "1"
    if len(sys.argv) > 1:
        choice = sys.argv[1].strip()
    else:
        try:
            user_input = input("\nEnter choice (1-5, default 1): ").strip()
            if user_input in SCENARIOS:
                choice = user_input
        except Exception:
            choice = "1"

    selected = SCENARIOS.get(choice, SCENARIOS["1"])
    print(f"\nTesting Baramati Scenario: {selected['title']}...")
    try:
        data = query_prediction(selected["payload"])
        display_results(data)
    except Exception as e:
        print("\nError connecting to API. Make sure uvicorn is running on http://localhost:8000")
        print("Details:", e)

if __name__ == "__main__":
    main()
