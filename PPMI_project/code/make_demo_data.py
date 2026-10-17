#!/usr/bin/env python3
"""
make_demo_data.py
Creates a SYNTHETIC stand-in for ON_state_temporal_pairs.csv so the training script can be run
end to end without PPMI data. Nothing here is real patient data and the results it produces
mean nothing clinically; it only proves that the code runs and shows the file layout.

Usage:  python make_demo_data.py <output folder>
"""
import sys, os
import numpy as np, pandas as pd

out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(42)
N_PAT, N_ROWS = 511, 1902

# rows per patient (at least 1), summing to N_ROWS
counts = np.ones(N_PAT, dtype=int)
for i in rng.choice(N_PAT, N_ROWS - N_PAT, replace=True): counts[i] += 1

rows = []
for k in range(N_PAT):
    pat = 3000 + k
    age0 = rng.normal(61, 9); male = int(rng.random() < 0.65)
    base_year = int(rng.integers(2011, 2016)); nhy_bl = int(rng.choice([1, 2], p=[0.35, 0.65]))
    np3_bl = max(0, rng.normal(22, 8)); sev = rng.normal(0, 1)          # patient-level severity
    start = int(rng.integers(4, 12))
    for j in range(counts[k]):
        ty = min(15, start + j + 1); fy = ty - 1
        age = age0 + fy
        nhy = int(np.clip(round(nhy_bl + 0.05 * fy + 0.4 * sev + rng.normal(0, 0.4)), 0, 2))
        np3 = max(0, np3_bl + 1.4 * fy + 4 * sev + rng.normal(0, 6))
        pigd = max(0, round(0.15 * np3 / 3 + 0.5 * sev + rng.normal(0, 0.8)))
        moca = float(np.clip(round(28 - 0.12 * fy - 0.5 * max(sev, 0) + rng.normal(0, 1.6)), 8, 30))
        z = -5.1 + 0.045 * (age - 62) + 0.9 * (nhy == 2) + 0.035 * (np3 - 30) + 0.45 * pigd - 0.05 * (moca - 27) + 0.2 * sev
        y = int(rng.random() < 1 / (1 + np.exp(-z)))
        r = dict(PATNO=pat, feature_year=fy, target_year=ty, y=y,
                 age_at_visit=round(age, 1), sex_male=male, baseline_year=base_year,
                 dx_duration_at_visit=round(fy + rng.normal(1.5, 0.8), 1), years_since_baseline=fy,
                 NHY_BL=nhy_bl, NP3TOT_BL=round(np3_bl, 0), NHY=nhy, NP3TOT=round(np3, 0),
                 NP3_tremor=max(0, round(rng.normal(4, 3))), NP3_rigidity=max(0, round(np3 * 0.22 + rng.normal(0, 2))),
                 NP3_bradykinesia=max(0, round(np3 * 0.45 + rng.normal(0, 3))), NP3_axial=max(0, round(np3 * 0.12 + rng.normal(0, 1.5))),
                 NP3_PIGD=pigd, NP2PTOT=max(0, round(5 + 0.6 * fy + 3 * sev + rng.normal(0, 3))),
                 NP1RTOT=max(0, round(3 + 0.2 * fy + rng.normal(0, 2))), ESS_total=int(np.clip(rng.normal(6, 3.5), 0, 24)),
                 GDS15_total=int(np.clip(rng.normal(2.5, 2.2), 0, 15)), RBDSQ_total_0to12=int(np.clip(rng.normal(3.5, 2.7), 0, 12)),
                 SCOPA_AUT_total_0to63=int(np.clip(rng.normal(10 + 0.4 * fy, 6), 0, 63)), STAI_state=int(np.clip(rng.normal(32, 9), 20, 80)),
                 STAI_trait=int(np.clip(rng.normal(33, 9), 20, 80)), MoCA_total=moca,
                 NP3TOT_change=round(np3 - np3_bl, 0), NHY_change=nhy - nhy_bl)
        rows.append(r)
df = pd.DataFrame(rows)
# sprinkle realistic gaps (about 6% in questionnaires and motor sub-scores)
for c in ['MoCA_total', 'ESS_total', 'GDS15_total', 'RBDSQ_total_0to12', 'SCOPA_AUT_total_0to63', 'STAI_state', 'STAI_trait',
          'NP3TOT', 'NP3_rigidity', 'NP3_axial', 'NP3_PIGD']:
    m = rng.random(len(df)) < 0.06; df.loc[m, c] = np.nan
df.to_csv(os.path.join(out, 'ON_state_temporal_pairs.csv'), index=False)
print(f'SYNTHETIC table written: {len(df)} rows | {df.PATNO.nunique()} patients | {int(df.y.sum())} positive labels')
