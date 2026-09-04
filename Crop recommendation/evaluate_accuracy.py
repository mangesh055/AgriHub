import json
import joblib
import pandas as pd
import numpy as np
import sys
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    top_k_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def evaluate():
    print("=" * 70)
    print("AGRIHUB BARAMATI CROP RECOMMENDATION MODEL - ACCURACY EVALUATION")
    print("Verified Datasets: ICAR-NIASM & KVK Baramati")
    print("=" * 70)

    # 1. Check saved model metadata
    try:
        with open("artifacts/model_metadata.json", "r") as f:
            meta = json.load(f)
        print(f"\nModel Version: {meta.get('model_version')}")
        print(f"Region:        {meta.get('region')}")
        print(f"Algorithm:     {meta.get('model_type')} ({meta.get('framework')})")
        print(f"Trained Date:  {meta.get('created_at')}")
        print("\nRecorded Test Set Metrics in Metadata:")
        for metric, val in meta.get("metrics", {}).items():
            print(f"  * {metric:<22}: {val*100:.2f}%" if "acc" in metric or "f1" in metric or "prec" in metric or "rec" in metric else f"  * {metric}: {val}")
    except Exception as e:
        print("Could not read metadata:", e)

    # 2. Live evaluation against the Baramati test dataset
    print("\n" + "-" * 70)
    print("Running Live Evaluation on Baramati Test Split...")
    print("-" * 70)

    model = joblib.load("artifacts/crop_model.joblib")
    df = pd.read_csv("data/processed/baramati_agronomic_dataset.csv")

    features = [
        "nitrogen", "phosphorus", "potassium", "ph", "organic_carbon",
        "temperature_avg", "temperature_min", "temperature_max",
        "humidity_avg", "rainfall", "rainfall_probability",
        "forecast_rainfall", "historical_seasonal_rainfall", "wind_speed",
        "microzone", "soil_type", "season"
    ]
    X = df[features].copy()
    y = df["crop"].copy()

    # Apply 25% missingness test condition (simulating farmers with missing lab soil test)
    np.random.seed(42)
    mask = np.random.rand(*X[["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon"]].shape) < 0.25
    X[["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon"]] = X[["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon"]].mask(mask)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    classes = model.named_steps["classifier"].classes_

    acc = accuracy_score(y_test, y_pred)
    top2_acc = top_k_accuracy_score(y_test, y_proba, k=2, labels=classes)
    top3_acc = top_k_accuracy_score(y_test, y_proba, k=3, labels=classes)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    macro_p = precision_score(y_test, y_pred, average="macro")
    macro_r = recall_score(y_test, y_pred, average="macro")

    print(f"\n[+] Top-1 Accuracy:  {acc * 100:.2f}%  (Top recommendation is exact match)")
    print(f"[+] Top-2 Accuracy:  {top2_acc * 100:.2f}%  (Correct crop is in Top 2)")
    print(f"[+] Top-3 Accuracy:  {top3_acc * 100:.2f}%  (Correct crop is in Top 3 recommendations)")
    print(f"[*] Macro F1-Score:  {macro_f1 * 100:.2f}%")
    print(f"[*] Macro Precision: {macro_p * 100:.2f}%")
    print(f"[*] Macro Recall:    {macro_r * 100:.2f}%")

    print("\nDetailed Per-Crop Performance Breakdown (Baramati Crops):")
    print(classification_report(y_test, y_pred, digits=3))
    print("=" * 70)

if __name__ == "__main__":
    evaluate()
