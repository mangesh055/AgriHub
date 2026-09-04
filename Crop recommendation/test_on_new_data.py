"""
AgriHub Baramati Model - New Data Testing Tool
-----------------------------------------------
Usage:
  1. Test a batch CSV file with new observations:
     python test_on_new_data.py --csv path/to/your_new_data.csv

  2. Test a single new farmer plot interactively:
     python test_on_new_data.py --interactive

  3. Test via direct command-line arguments:
     python test_on_new_data.py --village Malegaon --soil deep_black_vertisol --season annual --water high --irrigation canal

  4. Run sample verification:
     python test_on_new_data.py --sample
"""

import os
import sys
import json
import argparse
import urllib.request
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000/api/v1/recommend"
API_KEY = "agrihub-prod-key-2026"

CROP_SYNONYMS = {
    "jowar": "sorghum",
    "sorghum": "jowar",
    "cane": "sugarcane",
    "sugar_cane": "sugarcane",
    "chana": "chickpea",
    "gram": "chickpea",
    "corn": "maize",
    "pearl_millet": "bajra"
}

def query_api(payload):
    """Sends prediction request to the live FastAPI microservice."""
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        }
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode('utf-8'))

def predict_row(row_dict):
    """Builds clean API payload from arbitrary row dictionary and queries the model."""
    village = str(row_dict.get("village", "Malegaon")).strip().title()
    season = str(row_dict.get("season", "kharif")).strip().lower()
    soil = str(row_dict.get("soil_type", "medium_clay_loam")).strip().lower()
    water = str(row_dict.get("water_availability", "medium")).strip().lower()
    irr = str(row_dict.get("irrigation_source", "borewell")).strip().lower()
    prev = str(row_dict.get("previous_crop", "none")).strip().lower()

    payload = {
        "village": village,
        "season": season,
        "soil_type": soil,
        "water_availability": water,
        "irrigation_source": irr,
        "previous_crop": prev
    }

    # Optional NPK values if present and valid
    if pd.notna(row_dict.get("nitrogen")):
        payload["nitrogen"] = float(row_dict["nitrogen"])
    if pd.notna(row_dict.get("phosphorus")):
        payload["phosphorus"] = float(row_dict["phosphorus"])
    if pd.notna(row_dict.get("potassium")):
        payload["potassium"] = float(row_dict["potassium"])
    if pd.notna(row_dict.get("ph")):
        payload["ph"] = float(row_dict["ph"])

    # Optional custom weather if provided
    weather_keys = ["rainfall", "temperature_avg", "humidity_avg"]
    if any(pd.notna(row_dict.get(k)) for k in weather_keys):
        w = {}
        if pd.notna(row_dict.get("rainfall")):
            w["rainfall"] = float(row_dict["rainfall"])
        if pd.notna(row_dict.get("temperature_avg")):
            w["temperature_avg"] = float(row_dict["temperature_avg"])
        if pd.notna(row_dict.get("humidity_avg")):
            w["humidity_avg"] = float(row_dict["humidity_avg"])
        payload["weather"] = w

    res = query_api(payload)
    return res.get("recommendations", [])

def test_csv_file(csv_path):
    print("=" * 75)
    print(f"TESTING AGRIHUB MODEL ON NEW CSV FILE: {csv_path}")
    print("=" * 75)

    if not os.path.exists(csv_path):
        print(f"Error: File '{csv_path}' does not exist.")
        return

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows and {len(df.columns)} columns.")
    print("Columns:", list(df.columns))

    label_col = None
    for col in ["crop", "label", "actual_crop", "Crop", "target"]:
        if col in df.columns:
            label_col = col
            break

    top1_crops = []
    top1_confs = []
    top1_varieties = []
    top2_crops = []
    top3_crops = []

    print("\nRunning inference through AgriHub prediction engine...")
    for idx, row in df.iterrows():
        try:
            recs = predict_row(row.to_dict())
            c1 = recs[0]["crop"] if len(recs) > 0 else ""
            conf1 = recs[0]["confidence_pct"] if len(recs) > 0 else 0.0
            vars1 = ", ".join(recs[0].get("kvk_varieties", [])) if len(recs) > 0 else ""
            c2 = recs[1]["crop"] if len(recs) > 1 else ""
            c3 = recs[2]["crop"] if len(recs) > 2 else ""
        except Exception as e:
            c1, conf1, vars1, c2, c3 = "ERROR", 0.0, "", "", ""

        top1_crops.append(c1)
        top1_confs.append(conf1)
        top1_varieties.append(vars1)
        top2_crops.append(c2)
        top3_crops.append(c3)

    df["predicted_rank1"] = top1_crops
    df["confidence_rank1_pct"] = top1_confs
    df["kvk_varieties_rank1"] = top1_varieties
    df["predicted_rank2"] = top2_crops
    df["predicted_rank3"] = top3_crops

    out_file = csv_path.replace(".csv", "_predicted.csv")
    df.to_csv(out_file, index=False)
    print(f"[+] Output saved with predictions to: {out_file}")

    if label_col:
        print("\n" + "-" * 75)
        print(f"GROUND TRUTH DETECTED (Column: '{label_col}'). EVALUATING ACCURACY...")
        print("-" * 75)

        y_true = df[label_col].astype(str).str.lower().str.strip()

        def match_crop(actual, pred):
            if actual == pred:
                return True
            syn = CROP_SYNONYMS.get(actual)
            if syn and syn == pred:
                return True
            return False

        top1_hits = sum(match_crop(yt, p1) for yt, p1 in zip(y_true, top1_crops))
        top3_hits = sum(
            (match_crop(yt, p1) or match_crop(yt, p2) or match_crop(yt, p3))
            for yt, p1, p2, p3 in zip(y_true, top1_crops, top2_crops, top3_crops)
        )

        n = len(df)
        print(f"Total Rows:     {n}")
        print(f"Top-1 Accuracy: {(top1_hits / n) * 100:.2f}% ({top1_hits}/{n} exactly matched)")
        print(f"Top-3 Accuracy: {(top3_hits / n) * 100:.2f}% ({top3_hits}/{n} within top 3 recommendations)")

        print("\nSample Comparisons (Ground Truth vs Model Prediction):")
        cols = [label_col, "predicted_rank1", "confidence_rank1_pct", "predicted_rank2", "predicted_rank3"]
        print(df[cols].head(10).to_string())
    else:
        print("\nSample Model Predictions on New Data:")
        cols = [c for c in ["village", "soil_type", "season", "predicted_rank1", "confidence_rank1_pct", "kvk_varieties_rank1"] if c in df.columns]
        print(df[cols].head(10).to_string())

    print("=" * 75)

def interactive_mode():
    print("=" * 70)
    print("AGRIHUB BARAMATI - TEST NEW FARMER PLOT (INTERACTIVE)")
    print("=" * 70)
    village = input("Enter Baramati Village (e.g. Malegaon, Shardanagar, Supa, Pandare) [Malegaon]: ").strip() or "Malegaon"
    season = input("Enter Season (kharif / rabi / annual) [annual]: ").strip() or "annual"
    soil = input("Enter Soil Type (deep_black_vertisol / medium_clay_loam / shallow_murrum) [deep_black_vertisol]: ").strip() or "deep_black_vertisol"
    water = input("Enter Water Availability (high / medium / low) [high]: ").strip() or "high"
    irr = input("Enter Irrigation Source (canal / borewell / open_well / river / rainfed) [canal]: ").strip() or "canal"
    prev = input("Enter Previous Crop (e.g. sugarcane, soybean, wheat, fallow) [none]: ").strip() or "none"

    has_npk = input("Do you have Soil Lab N-P-K values? (y/n) [n]: ").strip().lower()
    n, p, k, ph = None, None, None, None
    if has_npk == "y":
        try:
            n = float(input("  Nitrogen (kg/ha): ").strip())
            p = float(input("  Phosphorus (kg/ha): ").strip())
            k = float(input("  Potassium (kg/ha): ").strip())
            ph = float(input("  Soil pH: ").strip())
        except Exception:
            print("  [Notice] Invalid input. Proceeding with Baramati zone defaults.")

    plot_dict = {
        "village": village,
        "season": season,
        "soil_type": soil,
        "water_availability": water,
        "irrigation_source": irr,
        "previous_crop": prev,
        "nitrogen": n,
        "phosphorus": p,
        "potassium": k,
        "ph": ph
    }

    print("\nSending prediction request to AgriHub API...")
    recs = predict_row(plot_dict)

    print("\n" + "=" * 70)
    print(f"TOP 3 RECOMMENDATIONS FOR: {village.upper()} | {season.upper()} | {soil}")
    print("=" * 70)
    for r in recs:
        rank = r.get("rank")
        crop = r.get("crop_name")
        marathi = r.get("marathi_name", "")
        conf = r.get("confidence_pct")
        vars_list = r.get("kvk_varieties", [])
        water_req = r.get("water_requirement", "").upper()
        print(f"\n[RANK #{rank}] {crop} ({marathi})")
        print(f"  Confidence:    {conf}%")
        print(f"  Water Need:    {water_req}")
        if vars_list:
            print(f"  KVK Varieties: {', '.join(vars_list)}")
        print("  Key Reasons:")
        for reason in r.get("reasons", [])[:2]:
            print(f"    + {reason}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Test AgriHub Model on New Data")
    parser.add_argument("--csv", type=str, help="Path to new CSV file to test")
    parser.add_argument("--interactive", action="store_true", help="Interactive terminal prompt")
    parser.add_argument("--sample", action="store_true", help="Generate and test on sample new data")
    parser.add_argument("--village", type=str, default=None, help="Village name")
    parser.add_argument("--soil", type=str, default="medium_clay_loam", help="Soil type")
    parser.add_argument("--season", type=str, default="kharif", help="Season (kharif/rabi/annual)")
    parser.add_argument("--water", type=str, default="medium", help="Water availability (high/medium/low)")
    parser.add_argument("--irrigation", type=str, default="borewell", help="Irrigation source")

    args = parser.parse_args()

    if args.csv:
        test_csv_file(args.csv)
    elif args.interactive:
        interactive_mode()
    elif args.sample:
        # Create realistic sample CSV
        sample_rows = [
            {"village": "Malegaon", "soil_type": "deep_black_vertisol", "season": "annual", "irrigation_source": "canal", "water_availability": "high", "crop": "sugarcane"},
            {"village": "Shardanagar", "soil_type": "medium_clay_loam", "season": "kharif", "irrigation_source": "borewell", "water_availability": "medium", "crop": "soybean"},
            {"village": "Supa", "soil_type": "shallow_murrum", "season": "rabi", "irrigation_source": "rainfed", "water_availability": "low", "crop": "jowar"},
            {"village": "Pandare", "soil_type": "medium_clay_loam", "season": "rabi", "irrigation_source": "canal", "water_availability": "medium", "crop": "wheat"},
            {"village": "Songaon", "soil_type": "deep_black_vertisol", "season": "kharif", "irrigation_source": "borewell", "water_availability": "medium", "crop": "maize"}
        ]
        sample_path = "sample_new_observations.csv"
        pd.DataFrame(sample_rows).to_csv(sample_path, index=False)
        test_csv_file(sample_path)
    elif args.village:
        plot_dict = {
            "village": args.village,
            "soil_type": args.soil,
            "season": args.season,
            "water_availability": args.water,
            "irrigation_source": args.irrigation
        }
        recs = predict_row(plot_dict)
        print("\n" + "=" * 70)
        print(f"RECOMMENDATIONS FOR: {args.village.upper()} ({args.season.upper()}):")
        print("=" * 70)
        for r in recs:
            print(f"Rank #{r['rank']}: {r['crop_name']} ({r.get('marathi_name','')}) - {r['confidence_pct']}% | Varieties: {', '.join(r.get('kvk_varieties',[]))}")
    else:
        print("Tip: Use 'python test_on_new_data.py --csv <your_file.csv>' or 'python test_on_new_data.py --interactive'")
        print("Running sample verification now...\n")
        sample_rows = [
            {"village": "Malegaon", "soil_type": "deep_black_vertisol", "season": "annual", "irrigation_source": "canal", "water_availability": "high", "crop": "sugarcane"},
            {"village": "Shardanagar", "soil_type": "medium_clay_loam", "season": "kharif", "irrigation_source": "borewell", "water_availability": "medium", "crop": "soybean"},
            {"village": "Supa", "soil_type": "shallow_murrum", "season": "rabi", "irrigation_source": "rainfed", "water_availability": "low", "crop": "jowar"},
            {"village": "Pandare", "soil_type": "medium_clay_loam", "season": "rabi", "irrigation_source": "canal", "water_availability": "medium", "crop": "wheat"},
            {"village": "Songaon", "soil_type": "deep_black_vertisol", "season": "kharif", "irrigation_source": "borewell", "water_availability": "medium", "crop": "maize"}
        ]
        sample_path = "sample_new_observations.csv"
        pd.DataFrame(sample_rows).to_csv(sample_path, index=False)
        test_csv_file(sample_path)

if __name__ == "__main__":
    main()
