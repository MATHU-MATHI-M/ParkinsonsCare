#!/usr/bin/env python3
'''
train_validate_test_pooled.py
Forecast: among ON-state PD patients below H&Y stage 3 at year t-1, probability of being at stage >= 3 at year t
(target years 5-15). Pooled person-year rows; every split is BY PATIENT (a patient is never in two sets).

Design (nested, patient-level):
  OUTER  : StratifiedGroupKFold(5), repeated 3 times     -> TEST set of each fold (never used for any choice)
  INNER  : inside each outer training part, 80% of patients = TRAIN, 20% = VALIDATION
           VALIDATION is used to (a) pick hyper-parameters, (b) fit the probability calibrator (Platt scaling)
  FINAL  : best model refit on all rows; calibrator fitted on the out-of-fold predictions
Input : ON_state_temporal_pairs.csv  (written by rolling_temporal_models.py)
Usage : python train_validate_test_pooled.py [DIR]
'''
import os, sys, ast, warnings
import numpy as np, pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedGroupKFold, GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

warnings.filterwarnings('ignore')
D = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs'
pr = pd.read_csv(os.path.join(D, 'ON_state_temporal_pairs.csv'))
pr = pr[pr.target_year >= 5].reset_index(drop=True)
y = pr.y.values; pats = pr.PATNO.values
print(f'DATA: {len(pr)} patient-year rows | {pr.PATNO.nunique()} patients | {int(y.sum())} new stage>=3 events')

REF = ['age_at_visit', 'sex_male', 'NHY', 'NP3TOT', 'years_since_baseline']
ALL = ['age_at_visit', 'sex_male', 'baseline_year', 'dx_duration_at_visit', 'years_since_baseline', 'NHY_BL', 'NP3TOT_BL',
       'NHY', 'NP3TOT', 'NP3_tremor', 'NP3_rigidity', 'NP3_bradykinesia', 'NP3_axial', 'NP3_PIGD', 'NP2PTOT', 'NP1RTOT',
       'ESS_total', 'GDS15_total', 'RBDSQ_total_0to12', 'SCOPA_AUT_total_0to63', 'STAI_state', 'STAI_trait', 'MoCA_total',
       'NP3TOT_change', 'NHY_change']
pre = lambda: [SimpleImputer(strategy='median'), StandardScaler()]
MODELS = {   # name -> (features, hyper-parameter grid, builder)   (no class weights, so probabilities stay realistic)
    'Reference LR (age, sex, H&Y, NP3TOT)': (REF, [{'C': c} for c in [0.1, 1.0]],
        lambda p: make_pipeline(*pre(), LogisticRegression(C=p['C'], max_iter=1000))),
    'Logistic regression (all)': (ALL, [{'C': c} for c in [0.01, 0.1, 1.0]],
        lambda p: make_pipeline(*pre(), LogisticRegression(C=p['C'], max_iter=1000))),
    'Random forest (all)': (ALL, [{'leaf': l} for l in [5, 10, 20]],
        lambda p: make_pipeline(SimpleImputer(strategy='median'), RandomForestClassifier(300, min_samples_leaf=p['leaf'], n_jobs=-1, random_state=0))),
    'Gradient boosting (all)': (ALL, [{'depth': d} for d in [2, 3]],
        lambda p: HistGradientBoostingClassifier(max_depth=p['depth'], learning_rate=0.05, max_iter=150, random_state=0)),
}
REFN = 'Reference LR (age, sex, H&Y, NP3TOT)'
lg = lambda p: np.log(np.clip(p, 1e-4, 1 - 1e-4) / (1 - np.clip(p, 1e-4, 1 - 1e-4))).reshape(-1, 1)
platt = lambda p, t: LogisticRegression(C=1e6).fit(lg(p), t)       # calibrator: maps a raw score to a probability
auc = lambda t, s: roc_auc_score(t, s) if len(set(t)) == 2 else np.nan

# ------------------------------------------------------------------ TRAIN / VALIDATE / TEST
REPEATS = 3
fold_rows, oof_all, raw_all = [], [], []
for rep in range(REPEATS):
    oof = {k: np.zeros(len(pr)) for k in MODELS}; raw = {k: np.zeros(len(pr)) for k in MODELS}
    outer = StratifiedGroupKFold(5, shuffle=True, random_state=rep)
    for f, (tr_all, te) in enumerate(outer.split(pr, y, pats)):
        gss = GroupShuffleSplit(1, test_size=0.2, random_state=100 + rep * 10 + f)
        a, b = next(gss.split(tr_all, y[tr_all], pats[tr_all]))
        tr, va = tr_all[a], tr_all[b]                                # patient-disjoint TRAIN and VALIDATION
        for k, (cols, grid, mk) in MODELS.items():
            best = None
            for p in grid:                                           # choose hyper-parameters on VALIDATION
                m = mk(p).fit(pr.iloc[tr][cols], y[tr]); pv = m.predict_proba(pr.iloc[va][cols])[:, 1]
                s = auc(y[va], pv)
                if best is None or s > best[0]:
                    best = (s, p, m, pv)
            vs, p, m, pv = best
            cal = platt(pv, y[va])                                   # calibrator fitted on VALIDATION predictions
            rt = m.predict_proba(pr.iloc[te][cols])[:, 1]
            pt = cal.predict_proba(lg(rt))[:, 1]
            oof[k][te] = pt; raw[k][te] = rt
            fold_rows.append(dict(repeat=rep, fold=f, model=k, chosen=str(p),
                                  train_patients=len(set(pats[tr])), train_rows=len(tr), train_events=int(y[tr].sum()),
                                  val_patients=len(set(pats[va])), val_rows=len(va), val_events=int(y[va].sum()),
                                  test_patients=len(set(pats[te])), test_rows=len(te), test_events=int(y[te].sum()),
                                  val_AUROC=round(vs, 3), test_AUROC=round(auc(y[te], pt), 3)))
    oof_all.append(oof); raw_all.append(raw)
folds = pd.DataFrame(fold_rows); folds.to_csv(os.path.join(D, 'pooled_fold_counts_and_scores.csv'), index=False)
print(); print('=== PATIENTS / ROWS / EVENTS IN EACH SET (random forest, repeat 0) ===')
print(folds[(folds.model == 'Random forest (all)') & (folds.repeat == 0)][
    ['fold', 'train_patients', 'train_rows', 'train_events', 'val_patients', 'val_rows', 'val_events', 'test_patients', 'test_rows', 'test_events']].to_string(index=False))
mean = folds[(folds.model == 'Random forest (all)')][['train_patients', 'val_patients', 'test_patients', 'train_rows', 'val_rows', 'test_rows', 'train_events', 'val_events', 'test_events']].mean().round(0)
print('Average per fold:', mean.to_dict())

# ------------------------------------------------------------------ POOLED OUT-OF-FOLD RESULTS
up = np.unique(pats); idx = {p: np.where(pats == p)[0] for p in up}; rng = np.random.default_rng(0)
boots = [np.concatenate([idx[p] for p in rng.choice(up, len(up))]) for _ in range(1000)]
o0 = oof_all[0]; rows = []
def calib(t, p):                                                     # calibration intercept and slope (ideal: 0 and 1)
    r = LogisticRegression(C=1e6).fit(lg(p), t); return r.intercept_[0], r.coef_[0][0]
for k in MODELS:
    A = [auc(y, o[k]) for o in oof_all]; B = [brier_score_loss(y, o[k]) for o in oof_all]
    ci = np.percentile([auc(y[s], o0[k][s]) for s in boots if len(set(y[s])) == 2], [2.5, 97.5])
    g = np.array([auc(y[s], o0[k][s]) - auc(y[s], o0[REFN][s]) for s in boots if len(set(y[s])) == 2])
    ic, sl = calib(y, o0[k])
    row = dict(model=k, AUROC=f'{np.mean(A):.3f} +/- {np.std(A):.3f}', AUROC_95CI_repeat0=f'{ci[0]:.3f}-{ci[1]:.3f}',
               AUPRC=round(average_precision_score(y, o0[k]), 3), Brier=f'{np.mean(B):.3f}',
               calib_intercept=round(ic, 2), calib_slope=round(sl, 2),
               gain_vs_reference='-' if k == REFN else f'{np.mean(A) - np.mean([auc(y, o[REFN]) for o in oof_all]):+.3f} ({np.percentile(g, 2.5):+.3f} to {np.percentile(g, 97.5):+.3f})')
    rows.append(row)
res = pd.DataFrame(rows); res.to_csv(os.path.join(D, 'pooled_final_results.csv'), index=False)
print(); print(f'=== TEST RESULTS (all test folds pooled; mean of {REPEATS} repeats; probabilities calibrated) ==='); print(res.to_string(index=False))
pd.DataFrame({'PATNO': pats, 'target_year': pr.target_year, 'y': y, **{k: o0[k] for k in MODELS}}).to_csv(os.path.join(D, 'pooled_out_of_fold_probabilities.csv'), index=False)

# calibration plot (repeat 0)
fig, ax = plt.subplots(1, 2, figsize=(11, 4.6))
for k in MODELS:
    q = pd.qcut(o0[k], 6, duplicates='drop'); g = pd.DataFrame({'p': o0[k], 'y': y}).groupby(q)
    ax[0].plot(g.p.mean(), g.y.mean(), marker='o', label=k)
ax[0].plot([0, 0.6], [0, 0.6], 'k--', lw=1); ax[0].set_xlabel('Predicted probability'); ax[0].set_ylabel('Observed fraction'); ax[0].set_title('Calibration (test folds)'); ax[0].legend(fontsize=7)
for k in MODELS: ax[1].hist(o0[k], bins=30, alpha=0.4, label=k)
ax[1].set_xlabel('Predicted probability'); ax[1].set_ylabel('Rows'); ax[1].set_title('Distribution of predictions')
fig.tight_layout(); fig.savefig(os.path.join(D, 'pooled_calibration_plot.png'), dpi=200)

# ------------------------------------------------------------------ FINAL MODEL + EXAMPLE PREDICTIONS
best_name = 'Random forest (all)'; cols, grid, mk = MODELS[best_name]
hp = ast.literal_eval(folds[folds.model == best_name].chosen.mode()[0])          # most frequently chosen setting
final = mk(hp).fit(pr[cols], y)                                                   # refit on ALL rows
cal_final = platt(raw_all[0][best_name], y)                                       # calibrator learned from out-of-fold raw scores
joblib.dump({'model': final, 'calibrator': cal_final, 'features': cols, 'hyper_parameters': hp}, os.path.join(D, 'final_model_random_forest.joblib'))
# usage on NEW patients:  b = joblib.load(file); p = b['calibrator'].predict_proba(lg(b['model'].predict_proba(df[b['features']])[:, 1]))[:, 1]
pr['pred'] = o0[best_name]                                                        # honest example: each row predicted by a model that never saw that patient
lo, mid, hi = pr.pred.idxmin(), (pr.pred - pr.pred.median()).abs().idxmin(), pr.pred.idxmax()
ex = pr.loc[[lo, mid, hi], ['PATNO', 'target_year', 'age_at_visit', 'NHY', 'NP3TOT', 'NP3_PIGD', 'MoCA_total', 'pred', 'y']].copy()
ex['pred'] = (ex.pred * 100).round(1).astype(str) + '%'
ex = ex.rename(columns={'pred': 'predicted_chance_stage3_next_year', 'y': 'actually_stage3'})
ex.to_csv(os.path.join(D, 'pooled_example_predictions.csv'), index=False)
print(); print(f'=== EXAMPLE predictions (out-of-fold, calibrated); final model hyper-parameters {hp} ==='); print(ex.to_string(index=False))
print('Saved: final_model_random_forest.joblib, pooled_*.csv, pooled_calibration_plot.png')
