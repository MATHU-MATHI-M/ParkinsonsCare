"""
Train PPMI Non-Motor Machine Learning Model
Uses all non-motor features in Dataset-ppmi.zip to train an accurate
classifier for cognitive impairment and disease burden progression risk.
Outputs production JSON artifacts for NeuroCare React Native app.
"""
import zipfile
import csv
import io
import json
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

ZIP_PATH = 'Dataset-ppmi.zip'
if not os.path.exists(ZIP_PATH):
    raise FileNotFoundError(f"Missing {ZIP_PATH}")

z = zipfile.ZipFile(ZIP_PATH)

def read_csv(filename):
    fname = f'Dataset-ppmi/{filename}'
    try:
        with z.open(fname) as raw:
            text = io.TextIOWrapper(raw, encoding='utf-8-sig', errors='replace')
            reader = csv.DictReader(text)
            return list(reader)
    except Exception as e:
        print(f"Warning: Could not read {filename}: {e}")
        return []

def safe_float(val, default=np.nan):
    try:
        if val in ('', 'NA', 'na', 'NaN', 'nan', None):
            return default
        return float(val)
    except:
        return default

def safe_int(val, default=None):
    v = safe_float(val, None)
    return int(v) if v is not None else default

print("1. Loading PPMI datasets from zip...")
part1_archived = read_csv('MDS_UPDRS_Part_I-Archived_29Jul2026.csv')
part1_pq = read_csv('MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv')
ess = read_csv('Epworth_Sleepiness_Scale_29Jul2026.csv')
gds = read_csv('Geriatric_Depression_Scale__Short_Version__29Jul2026.csv')
rbdsq = read_csv('REM_Sleep_Behavior_Disorder_Screening_Questionnaire_29Jul2026.csv')
scopa = read_csv('SCOPA-AUT_29Jul2026.csv')
stai = read_csv('State-Trait_Anxiety_Inventory_for_Adults_29Jul2026.csv')
moca = read_csv('Montreal_Cognitive_Assessment__MoCA__29Jul2026.csv')
hvlt = read_csv('Hopkins_Verbal_Learning_Test_-_Revised_29Jul2026.csv')
sdmt = read_csv('Symbol_Digit_Modalities_Test_29Jul2026.csv')
tmt = read_csv('Trail_Making_A_and_B_29Jul2026.csv')
lexical = read_csv('Lexical_Fluency_29Jul2026.csv')
semantic = read_csv('Modified_Semantic_Fluency_29Jul2026.csv')
bnt = read_csv('Modified_Boston_Naming_Test_29Jul2026.csv')
clock = read_csv('Clock_Drawing_29Jul2026.csv')
upsit = read_csv('University_of_Pennsylvania_Smell_Identification_Test_UPSIT_29Jul2026.csv')
vitals = read_csv('Vital_Signs_29Jul2026.csv')
demographics = read_csv('Demographics_29Jul2026.csv')
participant_status = read_csv('Participant_Status_29Jul2026.csv')

print("2. Indexing participant cohorts and demographics...")
pd_cohort = {}
for r in participant_status:
    patno = r.get('PATNO', '').strip()
    cdef = r.get('COHORT_DEFINITION', '')
    if patno:
        is_pd = 1 if 'Parkinson' in cdef else (0 if 'Control' in cdef else None)
        if is_pd is not None:
            pd_cohort[patno] = {
                'is_pd': is_pd,
                'enroll_age': safe_float(r.get('ENROLL_AGE')),
            }

demo_map = {}
for r in demographics:
    patno = r.get('PATNO', '').strip()
    if patno and patno not in demo_map:
        demo_map[patno] = {
            'sex': safe_int(r.get('SEX'), 1), # 1=Male, 2=Female
        }

def make_idx(rows):
    idx = {}
    for r in rows:
        p = r.get('PATNO', '').strip()
        e = r.get('EVENT_ID', '').strip()
        if p and e:
            idx[(p, e)] = r
    return idx

p1_map = make_idx(part1_archived)
p1pq_map = make_idx(part1_pq)
ess_map = make_idx(ess)
gds_map = make_idx(gds)
rbdsq_map = make_idx(rbdsq)
scopa_map = make_idx(scopa)
stai_map = make_idx(stai)
moca_map = make_idx(moca)
hvlt_map = make_idx(hvlt)
sdmt_map = make_idx(sdmt)
tmt_map = make_idx(tmt)
lexical_map = make_idx(lexical)
semantic_map = make_idx(semantic)
bnt_map = make_idx(bnt)
clock_map = make_idx(clock)
upsit_map = make_idx(upsit)
vitals_map = make_idx(vitals)

# Gather all (patno, event_id) pairs for PD and HC participants
all_keys = set()
for m in [p1_map, p1pq_map, ess_map, gds_map, rbdsq_map, scopa_map, moca_map]:
    all_keys.update(m.keys())

print(f"Total participant-visit keys: {len(all_keys)}")

dataset_rows = []
for (patno, event_id) in all_keys:
    if patno not in pd_cohort:
        continue
    cohort_info = pd_cohort[patno]
    demo = demo_map.get(patno, {'sex': 1})
    
    # MOCA
    m_row = moca_map.get((patno, event_id), {})
    moca_tot = safe_float(m_row.get('MCATOT'))
    
    # ESS
    e_row = ess_map.get((patno, event_id), {})
    ess_items = [safe_int(e_row.get(f'ESS{i}')) for i in range(1, 9)]
    valid_ess = [v for v in ess_items if v is not None]
    ess_tot = sum(valid_ess) if len(valid_ess) >= 5 else np.nan
    
    # GDS
    g_row = gds_map.get((patno, event_id), {})
    gds_items = ['GDSSATIS','GDSDROPD','GDSEMPTY','GDSBORED','GDSGSPIR',
                 'GDSAFRAD','GDSHAPPY','GDSHLPLS','GDSHOME','GDSMEMRY',
                 'GDSALIVE','GDSWRTLS','GDSENRGY','GDSHOPLS','GDSBETER']
    valid_gds = [safe_int(g_row.get(k)) for k in gds_items if safe_int(g_row.get(k)) is not None]
    gds_tot = sum(valid_gds) if len(valid_gds) >= 8 else np.nan
    
    # RBDSQ
    rb_row = rbdsq_map.get((patno, event_id), {})
    rb_items = ['DRMVIVID','DRMAGRAC','DRMNOCTB','SLPLMBMV','SLPINJUR',
                'DRMVERBL','DRMFIGHT','DRMUMV','DRMOBJFL','MVAWAKEN',
                'DRMREMEM','SLPDSTRB']
    valid_rb = [safe_int(rb_row.get(k)) for k in rb_items if safe_int(rb_row.get(k)) is not None]
    rbdsq_tot = sum(valid_rb) if len(valid_rb) >= 6 else np.nan
    
    # STAI
    st_row = stai_map.get((patno, event_id), {})
    stai_s_items = [safe_int(st_row.get(f'STAIAD{i}')) for i in range(1, 21)]
    valid_stai_s = [v for v in stai_s_items if v is not None]
    stai_state = sum(valid_stai_s) if len(valid_stai_s) >= 12 else np.nan
    stai_t_items = [safe_int(st_row.get(f'STAIAD{i}')) for i in range(21, 41)]
    valid_stai_t = [v for v in stai_t_items if v is not None]
    stai_trait = sum(valid_stai_t) if len(valid_stai_t) >= 12 else np.nan
    
    # SCOPA-AUT
    sc_row = scopa_map.get((patno, event_id), {})
    gi_vals = [safe_int(sc_row.get(f'SCAU{i}')) for i in range(1, 8)]
    uri_vals = [safe_int(sc_row.get(f'SCAU{i}')) for i in range(8, 14)]
    cardio_vals = [safe_int(sc_row.get(f'SCAU{i}')) for i in range(14, 17)]
    thermo_vals = [safe_int(sc_row.get(f'SCAU{i}')) for i in range(17, 22)]
    scopa_gi = sum([v for v in gi_vals if v is not None]) if any(v is not None for v in gi_vals) else np.nan
    scopa_uri = sum([v for v in uri_vals if v is not None]) if any(v is not None for v in uri_vals) else np.nan
    scopa_cardio = sum([v for v in cardio_vals if v is not None]) if any(v is not None for v in cardio_vals) else np.nan
    scopa_thermo = sum([v for v in thermo_vals if v is not None]) if any(v is not None for v in thermo_vals) else np.nan
    all_sc = [safe_int(sc_row.get(f'SCAU{i}')) for i in range(1, 26)]
    valid_sc = [v for v in all_sc if v is not None]
    scopa_tot = sum(valid_sc) if len(valid_sc) >= 10 else np.nan
    
    # Cognition - SDMT, HVLT, TMT, Fluency
    sdmt_tot = safe_float(sdmt_map.get((patno, event_id), {}).get('SDMTOTAL'))
    h_row = hvlt_map.get((patno, event_id), {})
    hvlt_tot = safe_float(h_row.get('DVT_TOTAL_RECALL'))
    if np.isnan(hvlt_tot):
        t1 = safe_float(h_row.get('HVLTRT1'), 0) or 0
        t2 = safe_float(h_row.get('HVLTRT2'), 0) or 0
        t3 = safe_float(h_row.get('HVLTRT3'), 0) or 0
        if t1 + t2 + t3 > 0:
            hvlt_tot = t1 + t2 + t3
    hvlt_delayed = safe_float(h_row.get('DVT_DELAYED_RECALL')) or safe_float(h_row.get('HVLTRDLY'))
    
    tmt_b = safe_float(tmt_map.get((patno, event_id), {}).get('TMTBSEC'))
    
    lex_row = lexical_map.get((patno, event_id), {})
    lf_f = safe_float(lex_row.get('LXFLUEF'))
    lf_a = safe_float(lex_row.get('LXFLUEA'))
    lf_s = safe_float(lex_row.get('LXFLUES'))
    lex_tot = (lf_f + lf_a + lf_s) if not (np.isnan(lf_f) or np.isnan(lf_a) or np.isnan(lf_s)) else np.nan
    
    sem_row = semantic_map.get((patno, event_id), {})
    sem_animals = safe_float(sem_row.get('VLTANIM'))
    
    bnt_val = safe_float(bnt_map.get((patno, event_id), {}).get('MBSTNSCR'))
    clock_val = safe_float(clock_map.get((patno, event_id), {}).get('CLCKTOT'))
    
    # UPSIT
    up_row = upsit_map.get((patno, event_id), {}) or upsit_map.get((patno, 'BL'), {}) or upsit_map.get((patno, 'SC'), {})
    upsit_tot = safe_float(up_row.get('TOTAL_CORRECT'))
    
    # Vitals - Orthostatic Drop
    v_row = vitals_map.get((patno, event_id), {})
    sys_sup = safe_float(v_row.get('SYSSUP'))
    sys_stnd = safe_float(v_row.get('SYSSTND'))
    ortho_drop = (sys_sup - sys_stnd) if (not np.isnan(sys_sup) and not np.isnan(sys_stnd)) else np.nan
    
    # MDS-UPDRS Part I
    p1 = p1_map.get((patno, event_id), {})
    p1pq = p1pq_map.get((patno, event_id), {})
    np1_cog = safe_float(p1.get('NP1COG'))
    np1_hall = safe_float(p1.get('NP1HALL'))
    np1_dprs = safe_float(p1.get('NP1DPRS'))
    np1_anxs = safe_float(p1.get('NP1ANXS'))
    np1_apat = safe_float(p1.get('NP1APAT'))
    np1_dds = safe_float(p1.get('NP1DDS'))
    np1_slpd = safe_float(p1pq.get('NP1SLPD'))
    np1_fatg = safe_float(p1pq.get('NP1FATG'))
    np1_pain = safe_float(p1pq.get('NP1PAIN'))
    np1_urin = safe_float(p1pq.get('NP1URIN'))
    np1_cnst = safe_float(p1pq.get('NP1CNST'))
    np1_lthd = safe_float(p1pq.get('NP1LTHD'))
    
    dataset_rows.append({
        'patno': patno,
        'event_id': event_id,
        'is_pd': cohort_info['is_pd'],
        'age': cohort_info['enroll_age'],
        'sex': demo['sex'],
        'moca_total': moca_tot,
        'ess_score': ess_tot,
        'gds_score': gds_tot,
        'rbdsq_score': rbdsq_tot,
        'stai_state': stai_state,
        'stai_trait': stai_trait,
        'scopa_total': scopa_tot,
        'scopa_gi': scopa_gi,
        'scopa_urinary': scopa_uri,
        'scopa_cardio': scopa_cardio,
        'scopa_thermo': scopa_thermo,
        'orthostatic_drop_sys': ortho_drop,
        'sdmt_total': sdmt_tot,
        'hvlt_total_recall': hvlt_tot,
        'hvlt_delayed_recall': hvlt_delayed,
        'tmt_b_sec': tmt_b,
        'lexical_fluency_total': lex_tot,
        'semantic_fluency_animals': sem_animals,
        'bnt_score': bnt_val,
        'clock_total': clock_val,
        'upsit_total': upsit_tot,
        'np1_cog': np1_cog,
        'np1_hall': np1_hall,
        'np1_dprs': np1_dprs,
        'np1_anxs': np1_anxs,
        'np1_apat': np1_apat,
        'np1_dds': np1_dds,
        'np1_slpd': np1_slpd,
        'np1_fatg': np1_fatg,
        'np1_pain': np1_pain,
        'np1_urin': np1_urin,
        'np1_cnst': np1_cnst,
        'np1_lthd': np1_lthd,
    })

df = pd.DataFrame(dataset_rows)
print(f"3. Extracted feature matrix: {df.shape[0]} rows x {df.shape[1]} columns")

# Filter rows that have at least some core non-motor data
core_cols = ['moca_total', 'ess_score', 'gds_score', 'scopa_total', 'np1_cog', 'np1_slpd']
valid_mask = df[core_cols].notnull().sum(axis=1) >= 2
df_filtered = df[valid_mask].copy()
print(f"Filtered to rows with at least 2 non-motor markers: {len(df_filtered)}")

# Target definition: High Non-Motor Impairment & Cognitive Decline Risk
# Clinical criteria: (moca_total < 26) OR (np1_cog >= 1) OR (gds_score >= 5 and ess_score >= 10)
# This identifies PD patients experiencing active non-motor progression requiring clinical intervention.
y = (
    (df_filtered['moca_total'] < 26) |
    (df_filtered['np1_cog'] >= 1) |
    ((df_filtered['gds_score'] >= 5) & (df_filtered['ess_score'] >= 10))
).astype(int)

feature_cols = [
    'age', 'sex', 'moca_total', 'ess_score', 'gds_score', 'rbdsq_score',
    'stai_state', 'stai_trait', 'scopa_total', 'scopa_gi', 'scopa_urinary',
    'scopa_cardio', 'scopa_thermo', 'orthostatic_drop_sys', 'sdmt_total',
    'hvlt_total_recall', 'hvlt_delayed_recall', 'tmt_b_sec',
    'lexical_fluency_total', 'semantic_fluency_animals', 'bnt_score',
    'clock_total', 'upsit_total', 'np1_cog', 'np1_hall', 'np1_dprs',
    'np1_anxs', 'np1_apat', 'np1_dds', 'np1_slpd', 'np1_fatg',
    'np1_pain', 'np1_urin', 'np1_cnst', 'np1_lthd'
]

X = df_filtered[feature_cols].copy()

# Feature labels and domains
feature_metadata_map = {
    'moca_total': {'label': 'MoCA Total Score', 'domain': 'Cognition', 'norm': [26, 30], 'higher_is': 'better'},
    'np1_cog': {'label': 'UPDRS Cognitive Impairment', 'domain': 'Cognition', 'norm': [0, 0], 'higher_is': 'worse'},
    'sdmt_total': {'label': 'Symbol Digit Modalities Test', 'domain': 'Cognition', 'norm': [40, 70], 'higher_is': 'better'},
    'hvlt_total_recall': {'label': 'HVLT Verbal Learning', 'domain': 'Cognition', 'norm': [45, 60], 'higher_is': 'better'},
    'hvlt_delayed_recall': {'label': 'HVLT Delayed Recall', 'domain': 'Cognition', 'norm': [45, 60], 'higher_is': 'better'},
    'tmt_b_sec': {'label': 'Trail Making B (Executive Speed)', 'domain': 'Cognition', 'norm': [40, 80], 'higher_is': 'worse'},
    'lexical_fluency_total': {'label': 'Phonemic Lexical Fluency', 'domain': 'Cognition', 'norm': [35, 60], 'higher_is': 'better'},
    'semantic_fluency_animals': {'label': 'Semantic Fluency (Animals)', 'domain': 'Cognition', 'norm': [18, 30], 'higher_is': 'better'},
    'clock_total': {'label': 'Clock Drawing Test', 'domain': 'Cognition', 'norm': [6, 7], 'higher_is': 'better'},
    'bnt_score': {'label': 'Boston Naming Score', 'domain': 'Cognition', 'norm': [28, 30], 'higher_is': 'better'},
    
    'ess_score': {'label': 'Epworth Sleepiness Scale', 'domain': 'Sleep', 'norm': [0, 10], 'higher_is': 'worse'},
    'rbdsq_score': {'label': 'RBD Sleep Behavior Disorder', 'domain': 'Sleep', 'norm': [0, 4], 'higher_is': 'worse'},
    'np1_slpd': {'label': 'UPDRS Sleep Problems', 'domain': 'Sleep', 'norm': [0, 1], 'higher_is': 'worse'},
    
    'gds_score': {'label': 'GDS-15 Depression Scale', 'domain': 'Mood', 'norm': [0, 4], 'higher_is': 'worse'},
    'stai_state': {'label': 'STAI State Anxiety', 'domain': 'Mood', 'norm': [20, 40], 'higher_is': 'worse'},
    'stai_trait': {'label': 'STAI Trait Anxiety', 'domain': 'Mood', 'norm': [20, 40], 'higher_is': 'worse'},
    'np1_dprs': {'label': 'UPDRS Depressed Mood', 'domain': 'Mood', 'norm': [0, 0], 'higher_is': 'worse'},
    'np1_anxs': {'label': 'UPDRS Anxious Mood', 'domain': 'Mood', 'norm': [0, 0], 'higher_is': 'worse'},
    'np1_apat': {'label': 'UPDRS Apathy', 'domain': 'Mood', 'norm': [0, 0], 'higher_is': 'worse'},
    
    'scopa_total': {'label': 'SCOPA-AUT Total Autonomic', 'domain': 'Autonomic', 'norm': [0, 15], 'higher_is': 'worse'},
    'scopa_gi': {'label': 'SCOPA Gastrointestinal', 'domain': 'Autonomic', 'norm': [0, 5], 'higher_is': 'worse'},
    'scopa_urinary': {'label': 'SCOPA Urinary', 'domain': 'Autonomic', 'norm': [0, 5], 'higher_is': 'worse'},
    'scopa_cardio': {'label': 'SCOPA Cardiovascular', 'domain': 'Autonomic', 'norm': [0, 2], 'higher_is': 'worse'},
    'scopa_thermo': {'label': 'SCOPA Thermoregulatory', 'domain': 'Autonomic', 'norm': [0, 3], 'higher_is': 'worse'},
    'orthostatic_drop_sys': {'label': 'Orthostatic Systolic BP Drop', 'domain': 'Autonomic', 'norm': [-10, 15], 'higher_is': 'worse'},
    'np1_urin': {'label': 'UPDRS Urinary Problems', 'domain': 'Autonomic', 'norm': [0, 1], 'higher_is': 'worse'},
    'np1_cnst': {'label': 'UPDRS Constipation', 'domain': 'Autonomic', 'norm': [0, 1], 'higher_is': 'worse'},
    'np1_lthd': {'label': 'UPDRS Lightheadedness', 'domain': 'Autonomic', 'norm': [0, 1], 'higher_is': 'worse'},
    
    'upsit_total': {'label': 'UPSIT Smell Identification', 'domain': 'Sensory', 'norm': [34, 40], 'higher_is': 'better'},
    'np1_pain': {'label': 'UPDRS Pain Sensations', 'domain': 'Sensory', 'norm': [0, 1], 'higher_is': 'worse'},
    'np1_fatg': {'label': 'UPDRS Fatigue', 'domain': 'Fatigue', 'norm': [0, 1], 'higher_is': 'worse'},
    'np1_hall': {'label': 'UPDRS Hallucinations/Psychosis', 'domain': 'Psychosis', 'norm': [0, 0], 'higher_is': 'worse'},
    'np1_dds': {'label': 'UPDRS Dopamine Dysregulation', 'domain': 'Behavior', 'norm': [0, 0], 'higher_is': 'worse'},
    'age': {'label': 'Patient Age', 'domain': 'Demographics', 'norm': [50, 75], 'higher_is': 'neutral'},
    'sex': {'label': 'Biological Sex', 'domain': 'Demographics', 'norm': [1, 2], 'higher_is': 'neutral'},
}

# Impute median values
imputer = SimpleImputer(strategy='median')
X_imputed = imputer.fit_transform(X)

# Scaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_imputed)

print("4. Training Random Forest & Logistic Regression Classifiers...")
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.25, random_state=42, stratify=y)

rf = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, class_weight='balanced')
rf.fit(X_train, y_train)

lr = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
lr.fit(X_train, y_train)

# Evaluate
y_pred_rf = rf.predict(X_test)
y_prob_rf = rf.predict_proba(X_test)[:, 1]

y_pred_lr = lr.predict(X_test)
y_prob_lr = lr.predict_proba(X_test)[:, 1]

# 5-fold cross validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_auc = cross_val_score(rf, X_scaled, y, cv=cv, scoring='roc_auc').mean()
cv_acc = cross_val_score(rf, X_scaled, y, cv=cv, scoring='accuracy').mean()

acc = accuracy_score(y_test, y_pred_rf)
auc = roc_auc_score(y_test, y_prob_rf)
rec = recall_score(y_test, y_pred_rf)
prec = precision_score(y_test, y_pred_rf)
f1 = f1_score(y_test, y_pred_rf)
cm = confusion_matrix(y_test, y_pred_rf)
tn, fp, fn, tp = cm.ravel()
spec = tn / (tn + fp)

print("=" * 60)
print(f"PPMI ML MODEL PERFORMANCE (Trained on {len(df_filtered)} visits):")
print(f"  Test Accuracy:        {acc * 100:.2f}% (5-Fold CV: {cv_acc * 100:.2f}%)")
print(f"  ROC-AUC Score:        {auc:.3f} (5-Fold CV: {cv_auc:.3f})")
print(f"  Sensitivity (Recall): {rec * 100:.2f}%")
print(f"  Specificity:          {spec * 100:.2f}%")
print(f"  Precision:            {prec * 100:.2f}%")
print(f"  F1 Score:             {f1:.3f}")
print(f"  Confusion Matrix:     TP={tp}, TN={tn}, FP={fp}, FN={fn}")
print("=" * 60)

# Feature Importances from Random Forest
raw_importances = rf.feature_importances_
feature_importance_list = []
for col, imp in zip(feature_cols, raw_importances):
    meta = feature_metadata_map.get(col, {'label': col, 'domain': 'General'})
    feature_importance_list.append({
        'feature': col,
        'label': meta['label'],
        'domain': meta['domain'],
        'importance': round(float(imp), 4),
        'importance_pct': round(float(imp) * 100, 1),
    })

feature_importance_list.sort(key=lambda x: x['importance'], reverse=True)

# Logistic regression coefficients for explainable edge inference
lr_coefs = {col: round(float(c), 4) for col, c in zip(feature_cols, lr.coef_[0])}
means = {col: round(float(m), 4) for col, m in zip(feature_cols, scaler.mean_)}
scales = {col: round(float(s), 4) for col, s in zip(feature_cols, scaler.scale_)}
medians = {col: round(float(m), 4) for col, m in zip(feature_cols, imputer.statistics_)}

model_payload = {
    'model_name': 'PPMI Non-Motor Progression & Cognitive Risk Classifier',
    'version': '3.0.0-PPMI-Trained',
    'training_cohort_size': len(df_filtered),
    'num_features': len(feature_cols),
    'metrics': {
        'accuracy': round(float(acc), 4),
        'accuracy_pct': f"{round(float(acc)*100, 1)}%",
        'cv_accuracy': round(float(cv_acc), 4),
        'roc_auc': round(float(auc), 4),
        'cv_roc_auc': round(float(cv_auc), 4),
        'sensitivity': round(float(rec), 4),
        'sensitivity_pct': f"{round(float(rec)*100, 1)}%",
        'specificity': round(float(spec), 4),
        'specificity_pct': f"{round(float(spec)*100, 1)}%",
        'precision': round(float(prec), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': {
            'tp': int(tp),
            'tn': int(tn),
            'fp': int(fp),
            'fn': int(fn)
        }
    },
    'features': feature_importance_list,
    'coefficients': lr_coefs,
    'intercept': round(float(lr.intercept_[0]), 4),
    'feature_means': means,
    'feature_scales': scales,
    'feature_medians': medians,
    'domain_weights': {
        'Cognition': 0.35,
        'Sleep': 0.20,
        'Mood': 0.20,
        'Autonomic': 0.15,
        'Sensory': 0.05,
        'Fatigue': 0.05
    },
    'metadata': feature_metadata_map
}

# Export to both NeuroCare data folder and project data folder
os.makedirs('data', exist_ok=True)
os.makedirs('NeuroCare/src/data', exist_ok=True)

with open('data/ppmi_model_trained.json', 'w', encoding='utf-8') as f:
    json.dump(model_payload, f, indent=2)

with open('NeuroCare/src/data/ppmiModel.json', 'w', encoding='utf-8') as f:
    json.dump(model_payload, f, indent=2)

print("\nSaved trained model artifact to:")
print("  - data/ppmi_model_trained.json")
print("  - NeuroCare/src/data/ppmiModel.json")
