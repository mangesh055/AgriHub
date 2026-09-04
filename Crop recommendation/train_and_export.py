import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, top_k_accuracy_score, classification_report

RANDOM_STATE = 42
MODEL_VERSION = "agrihub-baramati-v1.0.0"

# Load Baramati research dataset
df = pd.read_csv("data/processed/baramati_agronomic_dataset.csv")
print(f"Loaded {len(df)} verified Baramati records across {df['crop'].nunique()} crops.")

# Define feature sets
OPTIONAL_CHEMICAL_FEATURES = ["nitrogen", "phosphorus", "potassium", "ph", "organic_carbon"]
WEATHER_CONTINUOUS_FEATURES = [
    "temperature_avg", "temperature_min", "temperature_max",
    "humidity_avg", "rainfall", "rainfall_probability",
    "forecast_rainfall", "historical_seasonal_rainfall", "wind_speed"
]
CATEGORICAL_FEATURES = ["microzone", "soil_type", "season"]

ALL_FEATURES = OPTIONAL_CHEMICAL_FEATURES + WEATHER_CONTINUOUS_FEATURES + CATEGORICAL_FEATURES
TARGET = "crop"

X = df[ALL_FEATURES].copy()
y = df[TARGET].copy()

# Introduce 25% random missingness into optional chemical features to simulate realistic farmer submissions
np.random.seed(RANDOM_STATE)
mask_missing = np.random.rand(*X[OPTIONAL_CHEMICAL_FEATURES].shape) < 0.25
X[OPTIONAL_CHEMICAL_FEATURES] = X[OPTIONAL_CHEMICAL_FEATURES].mask(mask_missing)
print("Simulated 25% missing values on chemical soil test features (NIASM/KVK missing indicator pipeline).")

# Train/Test Split (Stratified 80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, stratify=y, random_state=RANDOM_STATE
)
print(f"Training set: {len(X_train)} rows | Test set: {len(X_test)} rows")

# Build Preprocessing Pipelines
chemical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
    ("scaler", StandardScaler())
])

weather_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
])

preprocessor = ColumnTransformer(transformers=[
    ("chem", chemical_transformer, OPTIONAL_CHEMICAL_FEATURES),
    ("weather", weather_transformer, WEATHER_CONTINUOUS_FEATURES),
    ("cat", categorical_transformer, CATEGORICAL_FEATURES)
])

# Benchmark Candidates on Baramati Data
models = {
    "Dummy (Most Frequent)": DummyClassifier(strategy="most_frequent"),
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    "Decision Tree": DecisionTreeClassifier(max_depth=12, random_state=RANDOM_STATE),
    "HistGradientBoosting": HistGradientBoostingClassifier(random_state=RANDOM_STATE),
    "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=12, min_samples_split=3, random_state=RANDOM_STATE, n_jobs=-1)
}

print("\n--- Baramati Model Benchmark (5-Fold Stratified CV Accuracy) ---")
for name, clf in models.items():
    pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", clf)])
    cv_scores = cross_val_score(pipe, X_train, y_train, cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE), scoring="accuracy")
    print(f"  {name:25s}: Mean CV Acc = {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Final Baramati Production Pipeline
final_pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=3,
        random_state=RANDOM_STATE,
        n_jobs=-1
    ))
])

final_pipeline.fit(X_train, y_train)

# Evaluate on Unseen Baramati Test Set
y_pred = final_pipeline.predict(X_test)
y_proba = final_pipeline.predict_proba(X_test)
classes = final_pipeline.named_steps["classifier"].classes_

acc = accuracy_score(y_test, y_pred)
macro_p = precision_score(y_test, y_pred, average="macro", zero_division=0)
macro_r = recall_score(y_test, y_pred, average="macro", zero_division=0)
macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
top3_acc = top_k_accuracy_score(y_test, y_proba, k=3, labels=classes)

print("\n--- Final Baramati Test Set Evaluation ---")
print(f"  Accuracy:         {acc:.4f} ({acc*100:.2f}%)")
print(f"  Macro Precision:  {macro_p:.4f}")
print(f"  Macro Recall:     {macro_r:.4f}")
print(f"  Macro F1-Score:   {macro_f1:.4f}")
print(f"  Top-3 Accuracy:   {top3_acc:.4f} ({top3_acc*100:.2f}%)")

print("\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, digits=3))

# Save Pipeline
joblib.dump(final_pipeline, "artifacts/crop_model.joblib")
print("Saved artifacts/crop_model.joblib")

# Save Feature Schema
feature_schema = {
    "version": MODEL_VERSION,
    "region": "Baramati, Pune District, Maharashtra",
    "target": "crop",
    "classes": list(classes),
    "features": {
        "required": {
            "microzone": {
                "type": "string",
                "enum": ["canal_command", "well_irrigated", "rainfed_scarcity"],
                "description": "Baramati farming sub-zone"
            },
            "soil_type": {
                "type": "string",
                "enum": ["deep_black_vertisol", "medium_clay_loam", "shallow_murrum"],
                "description": "Baramati soil classification"
            },
            "season": {
                "type": "string",
                "enum": ["kharif", "rabi", "summer", "annual"],
                "description": "Crop cycle season"
            },
            "temperature_avg": {"type": "float", "unit": "Celsius", "default": 27.5},
            "temperature_min": {"type": "float", "unit": "Celsius", "default": 20.0},
            "temperature_max": {"type": "float", "unit": "Celsius", "default": 34.0},
            "humidity_avg": {"type": "float", "unit": "%", "default": 65.0},
            "rainfall": {"type": "float", "unit": "mm", "default": 450.0},
            "rainfall_probability": {"type": "float", "unit": "%", "default": 45.0},
            "forecast_rainfall": {"type": "float", "unit": "mm", "default": 25.0},
            "historical_seasonal_rainfall": {"type": "float", "unit": "mm", "default": 480.0},
            "wind_speed": {"type": "float", "unit": "km/h", "default": 12.0}
        },
        "optional_soil_test": {
            "nitrogen": {"type": "float", "unit": "kg/ha", "nullable": True, "default": None},
            "phosphorus": {"type": "float", "unit": "kg/ha", "nullable": True, "default": None},
            "potassium": {"type": "float", "unit": "kg/ha", "nullable": True, "default": None},
            "ph": {"type": "float", "unit": "pH scale (0-14)", "nullable": True, "default": None},
            "organic_carbon": {"type": "float", "unit": "%", "nullable": True, "default": None}
        },
        "farmer_context": {
            "district": {"type": "string", "default": "Pune"},
            "taluka": {"type": "string", "default": "Baramati"},
            "village": {"type": "string", "nullable": True, "description": "e.g. Malegaon, Shardanagar, Supa, Pandare"},
            "farm_area_acres": {"type": "float", "default": 3.0},
            "irrigation_source": {
                "type": "string",
                "enum": ["canal", "borewell", "open_well", "river", "farm_pond", "rainfed"]
            },
            "water_availability": {
                "type": "string",
                "enum": ["high", "medium", "low", "scarce", "very_high"]
            },
            "seasonal_water_reliability": {
                "type": "string",
                "enum": ["reliable", "highly_reliable", "moderate", "unreliable"]
            },
            "irrigation_method": {
                "type": "string",
                "enum": ["drip", "sprinkler", "flood", "rainfed"]
            },
            "previous_crop": {"type": "string", "nullable": True}
        }
    }
}

with open("artifacts/feature_schema.json", "w", encoding="utf-8") as f:
    json.dump(feature_schema, f, indent=2)
print("Saved artifacts/feature_schema.json")

metadata = {
    "model_version": MODEL_VERSION,
    "region": "Baramati (ICAR-NIASM & KVK Baramati)",
    "model_type": "RandomForestClassifier",
    "framework": "scikit-learn",
    "created_at": datetime.now().isoformat(),
    "n_classes": len(classes),
    "classes": list(classes),
    "metrics": {
        "test_accuracy": round(float(acc), 4),
        "test_top3_accuracy": round(float(top3_acc), 4),
        "test_macro_f1": round(float(macro_f1), 4),
        "test_macro_precision": round(float(macro_p), 4),
        "test_macro_recall": round(float(macro_r), 4)
    },
    "features_required": list(feature_schema["features"]["required"].keys()),
    "features_optional": list(feature_schema["features"]["optional_soil_test"].keys())
}

with open("artifacts/model_metadata.json", "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)
print("Saved artifacts/model_metadata.json")
