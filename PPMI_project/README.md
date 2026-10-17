# PPMI next-year H&Y stage 3 forecasting - project folder

**Question answered:** for a Parkinson's patient who is below H&Y stage 3 at one annual ON-state visit,
what is the chance that the next annual ON-state visit is rated stage 3 or higher?
(label years 5 to 15; one percentage per patient-year row)

## Folder map

| Path | What it holds |
|---|---|
| `code/train_validate_test_pooled.py` | The model script (your original, unchanged). |
| `code/make_demo_data.py` | Makes a SYNTHETIC stand-in input table so the script can be tested without PPMI data. |
| `data/` | Put the real input here (see `data/README.txt`). The real file is NOT included. |
| `results_real_run/` | The real outputs from your run of the script (from `files (4).zip`). |
| `demo_synthetic_run/` | Input, outputs and console log of a test run on SYNTHETIC data. Numbers there are meaningless. |

## Real results (results_real_run/)

| File | Content |
|---|---|
| `pooled_final_results.csv` | AUROC, 95% CI, AUPRC, Brier, calibration intercept/slope, gain vs reference, per model |
| `pooled_fold_counts_and_scores.csv` | 60 rows: patients / rows / events per set, chosen hyper-parameter, validation and test AUROC per fold |
| `pooled_example_predictions.csv` | Lowest, median and highest predicted rows (contains participant IDs - do not publish) |
| `pooled_calibration_plot.png` | Calibration curves and distribution of predictions |
| `final_model_random_forest.joblib` | Final random forest + Platt calibrator + feature list + hyper-parameters |

Headline (pooled, mean of 3 repeats): reference LR 0.665, logistic regression 0.746, **random forest 0.767**,
gradient boosting 0.753 AUROC. The forest also has the best AUPRC (0.242), Brier (0.069) and calibration intercept (0.03).

## How the code works (one paragraph)

The script reads `ON_state_temporal_pairs.csv` (one row = one patient-year: 25 features from the earlier visit plus
the label `y`). It splits PATIENTS (never rows) into 5 outer folds, repeated 3 times. Inside each outer training part,
80% of patients train four models and 20% validate them: validation picks the hyper-parameters and fits a Platt
calibrator that turns raw scores into honest percentages. The hidden test fold is scored once. Pooled out-of-fold
predictions give AUROC, AUPRC, Brier, calibration and bootstrap intervals. Finally the random forest is refitted on all
rows and saved with its calibrator.

## Run it

```
pip install numpy pandas scikit-learn matplotlib joblib

# 1) test the code on synthetic data (about 1 minute on a normal laptop)
python code/make_demo_data.py my_demo
python code/train_validate_test_pooled.py my_demo

# 2) real run: copy ON_state_temporal_pairs.csv into a new folder, then
python code/train_validate_test_pooled.py my_real_run
```
Outputs are written into the folder you pass as the argument. If you give no argument the script writes to
`/mnt/user-data/outputs` (a path from the working environment) - always pass a folder.

## Using the saved model on new rows

```python
import joblib, numpy as np
b = joblib.load('final_model_random_forest.joblib')            # only load files you trust
raw = b['model'].predict_proba(df[b['features']])[:, 1]
r = np.clip(raw, 1e-4, 1 - 1e-4); logit = np.log(r / (1 - r)).reshape(-1, 1)
percent = b['calibrator'].predict_proba(logit)[:, 1] * 100     # chance of stage 3+ at the next annual visit
```

## Important notes
* The input table was built by earlier pipeline scripts (the pairs file is written by `rolling_temporal_models.py`,
  which itself needs baseline files from earlier steps). Those scripts are not in this folder.
* The percentage is a group frequency for similar patients at the NEXT annual visit - not a 1/5/10-year risk curve.
* Research use only; internal validation only.
