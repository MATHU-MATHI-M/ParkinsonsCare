import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.exceptions import InconsistentVersionWarning

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR / "PPMI_project" if (BASE_DIR / "PPMI_project").exists() else BASE_DIR

model_path = PROJECT_DIR / "results_real_run" / "final_model_random_forest.joblib"
if not model_path.exists():
    raise FileNotFoundError(f"Model file not found: {model_path}")

candidate_data_paths = [
    PROJECT_DIR / "data" / "model_input_pooled_years5to15.csv",
    PROJECT_DIR / "demo_synthetic_run" / "ON_state_temporal_pairs.csv",
]
data_path = next((p for p in candidate_data_paths if p.exists()), None)
if data_path is None:
    available = ", ".join(str(p) for p in PROJECT_DIR.rglob("*.csv"))
    raise FileNotFoundError(f"No usable CSV input found under {PROJECT_DIR}. Available CSVs: {available}")

b = joblib.load(model_path)
df = pd.read_csv(data_path)

df = df.sort_values(["PATNO", "target_year"]).reset_index(drop=True)

results = []
for patno, g in df.groupby("PATNO"):
    last_row = g.tail(1).copy()
    if last_row.empty:
        continue

    future_year = int(last_row["target_year"].iloc[0]) + 1
    row = last_row.copy()
    row["target_year"] = future_year

    X = row[b["features"]]
    raw = b["model"].predict_proba(X)[:, 1]
    r = np.clip(raw, 1e-4, 1 - 1e-4)
    logit = np.log(r / (1 - r)).reshape(-1, 1)
    prob = b["calibrator"].predict_proba(logit)[:, 1][0] * 100

    results.append({
        "PATNO": int(patno),
        "prior_year": int(last_row["target_year"].iloc[0]),
        "predicted_next_year": int(future_year),
        "predicted_stage3_plus_pct": round(float(prob), 2),
    })

out = pd.DataFrame(results)
print(f"Using data file: {data_path}")
print(out.head(10).to_string(index=False))
out_path = PROJECT_DIR / "predicted_all_patients.csv"
out.to_csv(out_path, index=False)
print(f"\nSaved: {out_path}")