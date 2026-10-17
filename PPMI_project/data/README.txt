The real input file is not included (PPMI data are access-controlled and the file was not provided).

Place here, or in the folder you run on:  ON_state_temporal_pairs.csv

Required columns (one row = one patient-year):
  PATNO, target_year, y,
  and the 25 predictors:
  age_at_visit, sex_male, baseline_year, dx_duration_at_visit, years_since_baseline, NHY_BL, NP3TOT_BL,
  NHY, NP3TOT, NP3_tremor, NP3_rigidity, NP3_bradykinesia, NP3_axial, NP3_PIGD, NP2PTOT, NP1RTOT,
  ESS_total, GDS15_total, RBDSQ_total_0to12, SCOPA_AUT_total_0to63, STAI_state, STAI_trait, MoCA_total,
  NP3TOT_change, NHY_change
Rows with target_year < 5 are dropped by the script. y = 1 if H&Y at target_year is 3, 4 or 5, otherwise 0.
Expected size in the reported study: 1,902 rows, 511 patients, 155 positive labels.
