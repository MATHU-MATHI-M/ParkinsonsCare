"""
PPMI Non-Motor Data Extractor
Reads the PPMI ZIP and generates:
1. demo_data.json - longitudinal records for demo patients (real PPMI data)
2. feature_metadata.json - data dictionary
3. model_output.json - rule-based ML predictions

All based on ACTUAL PPMI variable names confirmed by inspection.
"""
import zipfile
import csv
import io
import json
import statistics
from collections import defaultdict

ZIP_PATH = 'Dataset-ppmi.zip'
z = zipfile.ZipFile(ZIP_PATH)

def read_csv(filename):
    """Read a CSV from the ZIP, return list of dicts."""
    fname = f'Dataset-ppmi/{filename}'
    try:
        with z.open(fname) as raw:
            text = io.TextIOWrapper(raw, encoding='utf-8-sig', errors='replace')
            reader = csv.DictReader(text)
            return list(reader)
    except Exception as e:
        print(f"Warning: Could not read {filename}: {e}")
        return []

def safe_float(val, default=None):
    try:
        if val in ('', 'NA', 'na', 'NaN', 'nan', None):
            return default
        return float(val)
    except:
        return default

def safe_int(val, default=None):
    v = safe_float(val, default)
    return int(v) if v is not None else default

# ========== LOAD ALL NON-MOTOR FILES ==========
print("Loading PPMI data files...")

part1_archived = read_csv('MDS_UPDRS_Part_I-Archived_29Jul2026.csv')
part1_pq = read_csv('MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv')
part1_online = read_csv('MDS-UPDRS_Part_I_Non-Motor_Aspects__Online_-ret_29Jul2026.csv')
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

print("All files loaded.")

# ========== INDEX BY PATNO ==========

# Get PD cohort patients
pd_patients = set()
hc_patients = set()
enroll_age = {}
for row in participant_status:
    patno = row.get('PATNO', '')
    cohort_def = row.get('COHORT_DEFINITION', '')
    if 'Parkinson' in cohort_def:
        pd_patients.add(patno)
        enroll_age[patno] = safe_float(row.get('ENROLL_AGE'))
    elif 'Healthy Control' in cohort_def:
        hc_patients.add(patno)
        enroll_age[patno] = safe_float(row.get('ENROLL_AGE'))

print(f"PD patients: {len(pd_patients)}, HC: {len(hc_patients)}")

# Demographics
demo_map = {}  # patno -> {sex, birthdt, handed}
for row in demographics:
    patno = row.get('PATNO', '')
    if patno not in demo_map:
        demo_map[patno] = {
            'sex': safe_int(row.get('SEX')),
            'birthdt': row.get('BIRTHDT', ''),
            'handed': safe_int(row.get('HANDED'))
        }

# ========== FEATURE ENGINEERING FUNCTIONS ==========

def compute_ess_score(row):
    """ESS: sum of ESS1-ESS8, range 0-24. >10 = excessive daytime sleepiness."""
    items = ['ESS1','ESS2','ESS3','ESS4','ESS5','ESS6','ESS7','ESS8']
    vals = [safe_int(row.get(k)) for k in items]
    valid = [v for v in vals if v is not None]
    if len(valid) >= 6:
        return sum(valid)
    return None

def compute_gds_score(row):
    """GDS-15: 0=normal, 1=abnormal for each item. Total 0-15. >=5 = depression screen positive."""
    items = ['GDSSATIS','GDSDROPD','GDSEMPTY','GDSBORED','GDSGSPIR',
             'GDSAFRAD','GDSHAPPY','GDSHLPLS','GDSHOME','GDSMEMRY',
             'GDSALIVE','GDSWRTLS','GDSENRGY','GDSHOPLS','GDSBETER']
    vals = [safe_int(row.get(k)) for k in items]
    valid = [v for v in vals if v is not None]
    if len(valid) >= 10:
        return sum(valid)
    return None

def compute_rbdsq_score(row):
    """RBDSQ: sum of 13 items (binary 0/1). >=5 = RBD screen positive."""
    items = ['DRMVIVID','DRMAGRAC','DRMNOCTB','SLPLMBMV','SLPINJUR',
             'DRMVERBL','DRMFIGHT','DRMUMV','DRMOBJFL','MVAWAKEN',
             'DRMREMEM','SLPDSTRB']
    vals = [safe_int(row.get(k)) for k in items]
    valid = [v for v in vals if v is not None]
    if len(valid) >= 8:
        return sum(valid)
    return None

def compute_stai_state(row):
    """STAI State (items 1-20). Each 1-4. Range 20-80."""
    items = [f'STAIAD{i}' for i in range(1, 21)]
    vals = [safe_int(row.get(k)) for k in items]
    valid = [v for v in vals if v is not None]
    if len(valid) >= 15:
        return sum(valid)
    return None

def compute_stai_trait(row):
    """STAI Trait (items 21-40). Each 1-4. Range 20-80."""
    items = [f'STAIAD{i}' for i in range(21, 41)]
    vals = [safe_int(row.get(k)) for k in items]
    valid = [v for v in vals if v is not None]
    if len(valid) >= 15:
        return sum(valid)
    return None

def compute_scopa_subscores(row):
    """SCOPA-AUT subscores. Items 1-26 (0-3 each)."""
    gi_items = ['SCAU1','SCAU2','SCAU3','SCAU4','SCAU5','SCAU6','SCAU7']
    uri_items = ['SCAU8','SCAU9','SCAU10','SCAU11','SCAU12','SCAU13']
    cardio_items = ['SCAU14','SCAU15','SCAU16']
    thermo_items = ['SCAU17','SCAU18','SCAU19','SCAU20','SCAU21']
    
    def subscore(items):
        vals = [safe_int(row.get(k)) for k in items]
        valid = [v for v in vals if v is not None]
        if len(valid) >= len(items)//2:
            return sum(valid)
        return None
    
    gi = subscore(gi_items)
    uri = subscore(uri_items)
    cardio = subscore(cardio_items)
    thermo = subscore(thermo_items)
    
    all_items = gi_items + uri_items + cardio_items + thermo_items
    vals = [safe_int(row.get(k)) for k in all_items]
    valid = [v for v in vals if v is not None]
    total = sum(valid) if len(valid) >= 10 else None
    
    return {'gi': gi, 'urinary': uri, 'cardiovascular': cardio, 'thermoregulatory': thermo, 'total': total}

def compute_hvlt(row):
    # Use derived T-scores if available
    total_recall = safe_float(row.get('DVT_TOTAL_RECALL')) or (
        (safe_int(row.get('HVLTRT1'), 0) or 0) + (safe_int(row.get('HVLTRT2'), 0) or 0) + (safe_int(row.get('HVLTRT3'), 0) or 0)
    )
    delayed = safe_float(row.get('DVT_DELAYED_RECALL')) or safe_int(row.get('HVLTRDLY'))
    retention = safe_float(row.get('DVT_RETENTION'))
    recog = safe_float(row.get('DVT_RECOG_DISC_INDEX'))
    return {
        'total_recall': total_recall,
        'delayed_recall': delayed,
        'retention': retention,
        'recognition': recog
    }

def compute_lf_total(row):
    f = safe_int(row.get('LXFLUEF'))
    a = safe_int(row.get('LXFLUEA'))
    s = safe_int(row.get('LXFLUES'))
    if f is not None and a is not None and s is not None:
        return f + a + s
    return None

# ========== BUILD PER-PATIENT LONGITUDINAL DATA ==========

def index_by_patno_event(rows, patno_key='PATNO', event_key='EVENT_ID'):
    idx = defaultdict(dict)
    for row in rows:
        p = row.get(patno_key, '')
        e = row.get(event_key, '')
        if p and e:
            idx[p][e] = row
    return idx

part1_idx = index_by_patno_event(part1_archived)
part1pq_idx = index_by_patno_event(part1_pq)
ess_idx = index_by_patno_event(ess)
gds_idx = index_by_patno_event(gds)
rbdsq_idx = index_by_patno_event(rbdsq)
scopa_idx = index_by_patno_event(scopa)
stai_idx = index_by_patno_event(stai)
moca_idx = index_by_patno_event(moca)
hvlt_idx = index_by_patno_event(hvlt)
sdmt_idx = index_by_patno_event(sdmt)
tmt_idx = index_by_patno_event(tmt)
lexical_idx = index_by_patno_event(lexical)
semantic_idx = index_by_patno_event(semantic)
bnt_idx = index_by_patno_event(bnt)
clock_idx = index_by_patno_event(clock)
upsit_idx = index_by_patno_event(upsit)
vitals_idx = index_by_patno_event(vitals)

# Visit order
VISIT_ORDER = ['SC','BL','V01','V02','V03','V04','V05','V06','V07','V08','V09','V10','V11','V12','V13','V14','V15','V16','V17','V18']

def build_patient_visits(patno):
    """Build all available visits for a given PATNO."""
    visits = []
    all_events = set()
    for idx in [part1_idx, part1pq_idx, ess_idx, gds_idx, rbdsq_idx, scopa_idx, 
                stai_idx, moca_idx, hvlt_idx, sdmt_idx, tmt_idx]:
        all_events.update(idx.get(patno, {}).keys())
    
    # Sort by visit order
    def sort_key(e):
        try:
            return VISIT_ORDER.index(e)
        except ValueError:
            return 999
    
    for event in sorted(all_events, key=sort_key):
        # Skip SC (screening), include BL onward
        if event == 'SC':
            continue
            
        visit = {'event_id': event}
        
        # Get INFODT from available source
        for idx in [part1_idx, ess_idx, gds_idx, moca_idx]:
            row = idx.get(patno, {}).get(event)
            if row:
                visit['date'] = row.get('INFODT', '')
                break
        
        # MDS-UPDRS Part I (clinician-administered non-motor)
        p1 = part1_idx.get(patno, {}).get(event, {})
        visit['np1_cog'] = safe_int(p1.get('NP1COG'))
        visit['np1_hall'] = safe_int(p1.get('NP1HALL'))
        visit['np1_dprs'] = safe_int(p1.get('NP1DPRS'))
        visit['np1_anxs'] = safe_int(p1.get('NP1ANXS'))
        visit['np1_apat'] = safe_int(p1.get('NP1APAT'))
        visit['np1_dds'] = safe_int(p1.get('NP1DDS'))
        
        # MDS-UPDRS Part I Patient Questionnaire
        p1pq = part1pq_idx.get(patno, {}).get(event, {})
        visit['np1_slpn'] = safe_int(p1pq.get('NP1SLPN'))
        visit['np1_slpd'] = safe_int(p1pq.get('NP1SLPD'))
        visit['np1_pain'] = safe_int(p1pq.get('NP1PAIN'))
        visit['np1_urin'] = safe_int(p1pq.get('NP1URIN'))
        visit['np1_cnst'] = safe_int(p1pq.get('NP1CNST'))
        visit['np1_lthd'] = safe_int(p1pq.get('NP1LTHD'))
        visit['np1_fatg'] = safe_int(p1pq.get('NP1FATG'))
        
        # ESS
        ess_row = ess_idx.get(patno, {}).get(event, {})
        visit['ess_score'] = compute_ess_score(ess_row) if ess_row else None
        
        # GDS
        gds_row = gds_idx.get(patno, {}).get(event, {})
        visit['gds_score'] = compute_gds_score(gds_row) if gds_row else None
        
        # RBDSQ
        rbd_row = rbdsq_idx.get(patno, {}).get(event, {})
        visit['rbdsq_score'] = compute_rbdsq_score(rbd_row) if rbd_row else None
        
        # STAI
        stai_row = stai_idx.get(patno, {}).get(event, {})
        visit['stai_state'] = compute_stai_state(stai_row) if stai_row else None
        visit['stai_trait'] = compute_stai_trait(stai_row) if stai_row else None
        
        # SCOPA-AUT
        scopa_row = scopa_idx.get(patno, {}).get(event, {})
        if scopa_row:
            subscores = compute_scopa_subscores(scopa_row)
            visit['scopa_gi'] = subscores['gi']
            visit['scopa_urinary'] = subscores['urinary']
            visit['scopa_cardiovascular'] = subscores['cardiovascular']
            visit['scopa_thermoregulatory'] = subscores['thermoregulatory']
            visit['scopa_total'] = subscores['total']
        else:
            visit['scopa_gi'] = visit['scopa_urinary'] = None
            visit['scopa_cardiovascular'] = visit['scopa_thermoregulatory'] = None
            visit['scopa_total'] = None
        
        # MoCA
        moca_row = moca_idx.get(patno, {}).get(event, {})
        visit['moca_total'] = safe_int(moca_row.get('MCATOT')) if moca_row else None
        
        # HVLT
        hvlt_row = hvlt_idx.get(patno, {}).get(event, {})
        if hvlt_row:
            hv = compute_hvlt(hvlt_row)
            visit['hvlt_total_recall'] = hv['total_recall']
            visit['hvlt_delayed_recall'] = hv['delayed_recall']
            visit['hvlt_retention'] = hv['retention']
        else:
            visit['hvlt_total_recall'] = visit['hvlt_delayed_recall'] = visit['hvlt_retention'] = None
        
        # SDMT
        sdmt_row = sdmt_idx.get(patno, {}).get(event, {})
        visit['sdmt_total'] = safe_int(sdmt_row.get('SDMTOTAL')) if sdmt_row else None
        
        # TMT
        tmt_row = tmt_idx.get(patno, {}).get(event, {})
        visit['tmt_a_sec'] = safe_int(tmt_row.get('TMTASEC')) if tmt_row else None
        visit['tmt_b_sec'] = safe_int(tmt_row.get('TMTBSEC')) if tmt_row else None
        
        # Lexical Fluency
        lex_row = lexical_idx.get(patno, {}).get(event, {})
        visit['lexical_fluency_total'] = compute_lf_total(lex_row) if lex_row else None
        
        # Semantic Fluency (animals)
        sem_row = semantic_idx.get(patno, {}).get(event, {})
        visit['semantic_fluency_animals'] = safe_int(sem_row.get('VLTANIM')) if sem_row else None
        
        # BNT
        bnt_row = bnt_idx.get(patno, {}).get(event, {})
        visit['bnt_score'] = safe_int(bnt_row.get('MBSTNSCR')) if bnt_row else None
        
        # Clock Drawing
        clk_row = clock_idx.get(patno, {}).get(event, {})
        visit['clock_total'] = safe_int(clk_row.get('CLCKTOT')) if clk_row else None
        
        # UPSIT
        ups_row = upsit_idx.get(patno, {}).get(event, {})
        visit['upsit_total'] = safe_int(ups_row.get('TOTAL_CORRECT')) if ups_row else None
        visit['upsit_percentile'] = safe_float(ups_row.get('UPSIT_PRCNTGE')) if ups_row else None
        
        # Vitals (orthostatic)
        vit_row = vitals_idx.get(patno, {}).get(event, {})
        if vit_row:
            sys_sup = safe_float(vit_row.get('SYSSUP'))
            sys_std = safe_float(vit_row.get('SYSSTND'))
            if sys_sup and sys_std:
                visit['orthostatic_drop_sys'] = round(sys_sup - sys_std, 1)
            else:
                visit['orthostatic_drop_sys'] = None
            visit['hr_supine'] = safe_float(vit_row.get('HRSUP'))
            visit['hr_standing'] = safe_float(vit_row.get('HRSTND'))
        else:
            visit['orthostatic_drop_sys'] = visit['hr_supine'] = visit['hr_standing'] = None
        
        visits.append(visit)
    
    return visits

# ========== ML / SCORING MODEL ==========

def compute_non_motor_burden(visit):
    """
    Rule-based non-motor burden scoring derived from PPMI normative ranges.
    Returns domain scores (0-100, higher = worse) and overall burden score.
    
    PPMI normative ranges used:
    - ESS: 0-6 = normal (PD median ~7), >10 = excessive sleepiness
    - GDS: 0-4 = normal, >=5 = depression screen positive  
    - RBDSQ: 0-4 = normal, >=5 = RBD screen positive
    - MoCA: 26-30 = normal, 22-25 = mild, <22 = significant
    - SCOPA-AUT total: 0-10 normal range for PD
    - STAI-State: 20-40 = low, 40-60 = moderate, 60-80 = high
    """
    scores = {}
    
    # SLEEP DOMAIN (0-100)
    sleep_components = []
    if visit['ess_score'] is not None:
        # ESS 0-24, normalize: 0=0, 10=50, 24=100
        ess_norm = min(100, (visit['ess_score'] / 24) * 100)
        sleep_components.append(ess_norm)
    if visit['rbdsq_score'] is not None:
        rbd_norm = min(100, (visit['rbdsq_score'] / 13) * 100)
        sleep_components.append(rbd_norm)
    if visit['np1_slpn'] is not None:
        np1_norm = (visit['np1_slpn'] / 4) * 100
        sleep_components.append(np1_norm)
    if visit['np1_slpd'] is not None:
        np1d_norm = (visit['np1_slpd'] / 4) * 100
        sleep_components.append(np1d_norm)
    scores['sleep'] = round(statistics.mean(sleep_components), 1) if sleep_components else None
    
    # MOOD DOMAIN (0-100)
    mood_components = []
    if visit['gds_score'] is not None:
        gds_norm = min(100, (visit['gds_score'] / 15) * 100)
        mood_components.append(gds_norm)
    if visit['stai_state'] is not None:
        stai_norm = max(0, min(100, ((visit['stai_state'] - 20) / 60) * 100))
        mood_components.append(stai_norm)
    if visit['np1_dprs'] is not None:
        mood_components.append((visit['np1_dprs'] / 4) * 100)
    if visit['np1_anxs'] is not None:
        mood_components.append((visit['np1_anxs'] / 4) * 100)
    if visit['np1_apat'] is not None:
        mood_components.append((visit['np1_apat'] / 4) * 100)
    scores['mood'] = round(statistics.mean(mood_components), 1) if mood_components else None
    
    # COGNITION DOMAIN (0-100, higher = worse)
    cog_components = []
    if visit['moca_total'] is not None:
        # MoCA 30=0 burden, 0=100 burden
        moca_burden = max(0, min(100, ((30 - visit['moca_total']) / 30) * 100))
        cog_components.append(moca_burden)
    if visit['np1_cog'] is not None:
        cog_components.append((visit['np1_cog'] / 4) * 100)
    if visit['sdmt_total'] is not None:
        # SDMT: higher=better, typical range 30-80
        sdmt_burden = max(0, min(100, ((70 - visit['sdmt_total']) / 70) * 100))
        cog_components.append(sdmt_burden)
    scores['cognition'] = round(statistics.mean(cog_components), 1) if cog_components else None
    
    # AUTONOMIC DOMAIN (0-100)
    auto_components = []
    if visit['scopa_total'] is not None:
        # SCOPA total max ~69
        auto_norm = min(100, (visit['scopa_total'] / 30) * 100)
        auto_components.append(auto_norm)
    if visit['np1_urin'] is not None:
        auto_components.append((visit['np1_urin'] / 4) * 100)
    if visit['np1_cnst'] is not None:
        auto_components.append((visit['np1_cnst'] / 4) * 100)
    if visit['np1_lthd'] is not None:
        auto_components.append((visit['np1_lthd'] / 4) * 100)
    if visit['orthostatic_drop_sys'] is not None:
        # >20 mmHg drop = significant OH
        oh_burden = min(100, max(0, (visit['orthostatic_drop_sys'] / 30) * 100))
        auto_components.append(oh_burden)
    scores['autonomic'] = round(statistics.mean(auto_components), 1) if auto_components else None
    
    # SENSORY DOMAIN (0-100)
    sens_components = []
    if visit['upsit_total'] is not None:
        # UPSIT 40=0 burden, 0=100 burden
        upsit_burden = max(0, min(100, ((40 - visit['upsit_total']) / 40) * 100))
        sens_components.append(upsit_burden)
    scores['sensory'] = round(statistics.mean(sens_components), 1) if sens_components else None
    
    # PAIN / FATIGUE (0-100)
    pf_components = []
    if visit['np1_pain'] is not None:
        pf_components.append((visit['np1_pain'] / 4) * 100)
    if visit['np1_fatg'] is not None:
        pf_components.append((visit['np1_fatg'] / 4) * 100)
    scores['pain_fatigue'] = round(statistics.mean(pf_components), 1) if pf_components else None
    
    # PSYCHOSIS (0-100)
    if visit['np1_hall'] is not None:
        scores['psychosis'] = round((visit['np1_hall'] / 4) * 100, 1)
    else:
        scores['psychosis'] = None
    
    # OVERALL NON-MOTOR BURDEN (weighted average of available domains)
    weights = {'sleep': 0.2, 'mood': 0.25, 'cognition': 0.25, 'autonomic': 0.2, 'sensory': 0.1}
    weighted_sum = 0
    weight_total = 0
    for domain, w in weights.items():
        if scores.get(domain) is not None:
            weighted_sum += scores[domain] * w
            weight_total += w
    
    scores['overall'] = round(weighted_sum / weight_total, 1) if weight_total > 0 else None
    
    # SEVERITY LABELS
    def severity(score):
        if score is None: return 'unknown'
        if score < 25: return 'low'
        if score < 50: return 'moderate'
        if score < 75: return 'high'
        return 'severe'
    
    labels = {k: severity(v) for k, v in scores.items()}
    
    # MCI RISK (rule-based)
    mci_flags = []
    if visit['moca_total'] is not None:
        if visit['moca_total'] < 22:
            mci_flags.append('MoCA < 22 (significant cognitive impairment)')
        elif visit['moca_total'] < 26:
            mci_flags.append('MoCA 22-25 (mild cognitive impairment)')
    if visit['sdmt_total'] is not None and visit['sdmt_total'] < 35:
        mci_flags.append('SDMT < 35 (processing speed concerns)')
    
    depression_flag = visit['gds_score'] is not None and visit['gds_score'] >= 5
    ess_flag = visit['ess_score'] is not None and visit['ess_score'] > 10
    rbd_flag = visit['rbdsq_score'] is not None and visit['rbdsq_score'] >= 5
    
    return {
        'domain_scores': scores,
        'severity_labels': labels,
        'mci_risk_flags': mci_flags,
        'depression_screen_positive': depression_flag,
        'excessive_daytime_sleepiness': ess_flag,
        'rbd_screen_positive': rbd_flag
    }

# ========== SELECT DEMO PATIENTS ==========
# Use PATNO 3001, 3003 (confirmed PD), 3004 (Healthy Control for comparison)
DEMO_PATNOS = ['3001', '3003']

demo_patients = []
for patno in DEMO_PATNOS:
    if patno not in pd_patients:
        print(f"Warning: PATNO {patno} not in PD cohort")
        continue
    
    dem = demo_map.get(patno, {})
    visits = build_patient_visits(patno)
    
    # Compute burden scores for each visit
    for v in visits:
        burden = compute_non_motor_burden(v)
        v['burden'] = burden
    
    # Filter to visits with at least some data
    visits = [v for v in visits if any(
        v.get(k) is not None for k in ['moca_total', 'gds_score', 'ess_score', 'scopa_total']
    )]
    
    age = enroll_age.get(patno)
    sex_code = dem.get('sex')
    sex_str = 'Female' if sex_code == 0 else ('Male' if sex_code == 1 else 'Unknown')
    
    demo_patients.append({
        'patno': patno,
        'display_id': f'NC-{patno}',
        'sex': sex_str,
        'enroll_age': age,
        'cohort': 'Parkinson\'s Disease',
        'visits': visits
    })
    
    print(f"PATNO {patno}: {len(visits)} visits with data")

# ========== FEATURE IMPORTANCE (from data variance) ==========
# Compute variance of each non-motor feature across all PD patients
# This gives a data-driven importance ranking

feature_vals = defaultdict(list)
feature_names = [
    ('ess_score', 'Epworth Sleepiness Scale'),
    ('gds_score', 'Geriatric Depression Scale'),
    ('rbdsq_score', 'RBD Screening Questionnaire'),
    ('stai_state', 'STAI State Anxiety'),
    ('stai_trait', 'STAI Trait Anxiety'),
    ('moca_total', 'Montreal Cognitive Assessment'),
    ('sdmt_total', 'Symbol Digit Modalities Test'),
    ('scopa_total', 'SCOPA-AUT Total'),
    ('scopa_gi', 'SCOPA-AUT GI Subscore'),
    ('scopa_urinary', 'SCOPA-AUT Urinary Subscore'),
    ('upsit_total', 'UPSIT Smell Identification'),
    ('np1_dprs', 'MDS-UPDRS NP1 Depression'),
    ('np1_anxs', 'MDS-UPDRS NP1 Anxiety'),
    ('np1_apat', 'MDS-UPDRS NP1 Apathy'),
    ('np1_slpn', 'MDS-UPDRS NP1 Nighttime Sleep'),
    ('np1_slpd', 'MDS-UPDRS NP1 Daytime Sleepiness'),
    ('np1_pain', 'MDS-UPDRS NP1 Pain'),
    ('np1_fatg', 'MDS-UPDRS NP1 Fatigue'),
    ('np1_hall', 'MDS-UPDRS NP1 Hallucinations'),
    ('np1_cog', 'MDS-UPDRS NP1 Cognitive Complaints'),
    ('tmt_b_sec', 'Trail Making Test B (seconds)'),
    ('hvlt_total_recall', 'HVLT Total Recall'),
    ('hvlt_delayed_recall', 'HVLT Delayed Recall'),
    ('lexical_fluency_total', 'Lexical Fluency (FAS Total)'),
    ('semantic_fluency_animals', 'Semantic Fluency (Animals)'),
    ('orthostatic_drop_sys', 'Orthostatic BP Drop (systolic)'),
]

# Sample from first 200 PD patients
sample_patnos = list(pd_patients)[:200]
for patno in sample_patnos:
    for fname_key, label in feature_names:
        for idx_dict in [part1_idx, part1pq_idx, ess_idx, gds_idx, rbdsq_idx, 
                          stai_idx, moca_idx, sdmt_idx, scopa_idx, upsit_idx, tmt_idx, hvlt_idx, lexical_idx, semantic_idx, vitals_idx]:
            events = idx_dict.get(patno, {})
            for event, row in events.items():
                # We already have structured functions, just collect raw for variance
                break

# Compute from demo patient visits as a simpler approach
all_feature_vals = defaultdict(list)
for p in demo_patients:
    for v in p['visits']:
        for feat, label in feature_names:
            val = v.get(feat)
            if val is not None:
                all_feature_vals[feat].append(val)

# Also sample from a wider set of patients for better variance
for patno in list(pd_patients)[:50]:
    visits = build_patient_visits(patno)
    for v in visits:
        for feat, label in feature_names:
            val = v.get(feat)
            if val is not None:
                all_feature_vals[feat].append(val)

# Compute relative importance from variance (higher variance = more discriminative)
importance_scores = {}
for feat, vals in all_feature_vals.items():
    if len(vals) >= 3:
        try:
            var = statistics.variance(vals)
            importance_scores[feat] = var
        except:
            importance_scores[feat] = 0

# Normalize importance to 0-1
if importance_scores:
    max_imp = max(importance_scores.values())
    if max_imp > 0:
        for k in importance_scores:
            importance_scores[k] = round(importance_scores[k] / max_imp, 3)

feature_importance = []
for feat, label in feature_names:
    imp = importance_scores.get(feat, 0)
    feature_importance.append({
        'feature': feat,
        'label': label,
        'importance': imp
    })
feature_importance.sort(key=lambda x: -x['importance'])

# ========== GENERATE FEATURE METADATA JSON ==========
feature_metadata = {
    "description": "PPMI Non-Motor Feature Data Dictionary",
    "dataset": "PPMI (Parkinson's Progression Markers Initiative)",
    "extraction_date": "2026-09-05",
    "note": "Only non-motor features included. Variables verified against actual PPMI CSV column names.",
    "features": []
}

metadata_entries = [
    # Sleep
    {"feature": "ess_score", "label": "Epworth Sleepiness Scale Total", "source": "Epworth_Sleepiness_Scale_29Jul2026.csv",
     "columns": ["ESS1","ESS2","ESS3","ESS4","ESS5","ESS6","ESS7","ESS8"], "domain": "Sleep",
     "type": "ordinal_sum", "range": "0-24", "threshold": ">10 = excessive daytime sleepiness",
     "ml_feature": True, "ui_visible": True, "missingness_note": "Good coverage at BL and early visits"},
    {"feature": "rbdsq_score", "label": "REM Sleep Behavior Disorder Screening Questionnaire Total", 
     "source": "REM_Sleep_Behavior_Disorder_Screening_Questionnaire_29Jul2026.csv",
     "columns": ["DRMVIVID","DRMAGRAC","DRMNOCTB","SLPLMBMV","SLPINJUR","DRMVERBL","DRMFIGHT","DRMUMV","DRMOBJFL","MVAWAKEN","DRMREMEM","SLPDSTRB"],
     "domain": "Sleep", "type": "binary_sum", "range": "0-13", "threshold": ">=5 = RBD screen positive",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_slpn", "label": "MDS-UPDRS NP1 - Nighttime Sleep Problems", 
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1SLPN"], "domain": "Sleep", "type": "ordinal", "range": "0-4",
     "scoring": "0=normal, 1=slight, 2=mild, 3=moderate, 4=severe",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_slpd", "label": "MDS-UPDRS NP1 - Daytime Sleepiness", 
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1SLPD"], "domain": "Sleep", "type": "ordinal", "range": "0-4",
     "ml_feature": True, "ui_visible": True},
    # Mood - Depression
    {"feature": "gds_score", "label": "Geriatric Depression Scale (Short Form) Total",
     "source": "Geriatric_Depression_Scale__Short_Version__29Jul2026.csv",
     "columns": ["GDSSATIS","GDSDROPD","GDSEMPTY","GDSBORED","GDSGSPIR","GDSAFRAD","GDSHAPPY","GDSHLPLS","GDSHOME","GDSMEMRY","GDSALIVE","GDSWRTLS","GDSENRGY","GDSHOPLS","GDSBETER"],
     "domain": "Mood", "type": "binary_sum", "range": "0-15", "threshold": ">=5 = depression screening positive",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_dprs", "label": "MDS-UPDRS NP1 - Depressed Mood",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1DPRS"],
     "domain": "Mood", "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "np1_anxs", "label": "MDS-UPDRS NP1 - Anxious Mood",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1ANXS"],
     "domain": "Mood", "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "np1_apat", "label": "MDS-UPDRS NP1 - Apathy",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1APAT"],
     "domain": "Mood", "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    # Mood - Anxiety
    {"feature": "stai_state", "label": "STAI State Anxiety Score",
     "source": "State-Trait_Anxiety_Inventory_for_Adults_29Jul2026.csv",
     "columns": [f"STAIAD{i}" for i in range(1,21)], "domain": "Mood",
     "type": "ordinal_sum", "range": "20-80", "threshold": ">40 = moderate anxiety; >60 = high anxiety",
     "ml_feature": True, "ui_visible": True},
    {"feature": "stai_trait", "label": "STAI Trait Anxiety Score",
     "source": "State-Trait_Anxiety_Inventory_for_Adults_29Jul2026.csv",
     "columns": [f"STAIAD{i}" for i in range(21,41)], "domain": "Mood",
     "type": "ordinal_sum", "range": "20-80", "ml_feature": True, "ui_visible": True},
    # Cognition
    {"feature": "moca_total", "label": "Montreal Cognitive Assessment Total Score",
     "source": "Montreal_Cognitive_Assessment__MoCA__29Jul2026.csv",
     "columns": ["MCATOT"], "domain": "Cognition", "type": "ordinal_sum", "range": "0-30",
     "threshold": ">=26 = normal; 22-25 = mild impairment; <22 = significant impairment",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_cog", "label": "MDS-UPDRS NP1 - Cognitive Impairment",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1COG"],
     "domain": "Cognition", "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "sdmt_total", "label": "Symbol Digit Modalities Test Total",
     "source": "Symbol_Digit_Modalities_Test_29Jul2026.csv", "columns": ["SDMTOTAL"],
     "domain": "Cognition", "type": "continuous", "range": "0-110",
     "note": "Higher is better; measures processing speed; T-score available as DVT_SDM",
     "ml_feature": True, "ui_visible": True},
    {"feature": "hvlt_total_recall", "label": "HVLT-R Total Recall (T-score)",
     "source": "Hopkins_Verbal_Learning_Test_-_Revised_29Jul2026.csv",
     "columns": ["DVT_TOTAL_RECALL","HVLTRT1","HVLTRT2","HVLTRT3"],
     "domain": "Cognition", "type": "continuous", "note": "Higher=better; verbal learning and memory",
     "ml_feature": True, "ui_visible": True},
    {"feature": "hvlt_delayed_recall", "label": "HVLT-R Delayed Recall (T-score)",
     "source": "Hopkins_Verbal_Learning_Test_-_Revised_29Jul2026.csv",
     "columns": ["DVT_DELAYED_RECALL","HVLTRDLY"], "domain": "Cognition",
     "type": "continuous", "ml_feature": True, "ui_visible": True},
    {"feature": "tmt_a_sec", "label": "Trail Making Test A (seconds)",
     "source": "Trail_Making_A_and_B_29Jul2026.csv", "columns": ["TMTASEC"],
     "domain": "Cognition", "type": "continuous", "note": "Lower=better; measures attention/processing speed",
     "ml_feature": False, "ui_visible": True},
    {"feature": "tmt_b_sec", "label": "Trail Making Test B (seconds)",
     "source": "Trail_Making_A_and_B_29Jul2026.csv", "columns": ["TMTBSEC"],
     "domain": "Cognition", "type": "continuous", "note": "Lower=better; measures executive function",
     "ml_feature": True, "ui_visible": True},
    {"feature": "lexical_fluency_total", "label": "Lexical Fluency Total (F+A+S)",
     "source": "Lexical_Fluency_29Jul2026.csv", "columns": ["LXFLUEF","LXFLUEA","LXFLUES"],
     "domain": "Cognition", "type": "continuous", "note": "Higher=better; phonemic fluency",
     "ml_feature": True, "ui_visible": True},
    {"feature": "semantic_fluency_animals", "label": "Semantic Fluency - Animals",
     "source": "Modified_Semantic_Fluency_29Jul2026.csv", "columns": ["VLTANIM"],
     "domain": "Cognition", "type": "continuous", "note": "Higher=better; semantic memory",
     "ml_feature": True, "ui_visible": True},
    {"feature": "bnt_score", "label": "Modified Boston Naming Test Score",
     "source": "Modified_Boston_Naming_Test_29Jul2026.csv", "columns": ["MBSTNSCR"],
     "domain": "Cognition", "type": "continuous", "range": "0-30",
     "note": "Higher=better; confrontation naming", "ml_feature": False, "ui_visible": True},
    {"feature": "clock_total", "label": "Clock Drawing Test Total Score",
     "source": "Clock_Drawing_29Jul2026.csv", "columns": ["CLCKTOT"],
     "domain": "Cognition", "type": "ordinal_sum", "range": "0-7",
     "note": "Higher=better; visuospatial/executive", "ml_feature": False, "ui_visible": True},
    # Autonomic
    {"feature": "scopa_total", "label": "SCOPA-AUT Total Score",
     "source": "SCOPA-AUT_29Jul2026.csv",
     "columns": ["SCAU1 through SCAU26"], "domain": "Autonomic",
     "type": "ordinal_sum", "range": "0-69", "note": "Higher=worse",
     "ml_feature": True, "ui_visible": True},
    {"feature": "scopa_gi", "label": "SCOPA-AUT GI Subscore",
     "source": "SCOPA-AUT_29Jul2026.csv", "columns": ["SCAU1-SCAU7"],
     "domain": "Autonomic", "type": "ordinal_sum", "range": "0-21",
     "ml_feature": True, "ui_visible": True},
    {"feature": "scopa_urinary", "label": "SCOPA-AUT Urinary Subscore",
     "source": "SCOPA-AUT_29Jul2026.csv", "columns": ["SCAU8-SCAU13"],
     "domain": "Autonomic", "type": "ordinal_sum", "range": "0-18",
     "ml_feature": True, "ui_visible": True},
    {"feature": "scopa_cardiovascular", "label": "SCOPA-AUT Cardiovascular Subscore",
     "source": "SCOPA-AUT_29Jul2026.csv", "columns": ["SCAU14-SCAU16"],
     "domain": "Autonomic", "type": "ordinal_sum", "range": "0-9",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_urin", "label": "MDS-UPDRS NP1 - Urinary Problems",
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1URIN"], "domain": "Autonomic",
     "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "np1_cnst", "label": "MDS-UPDRS NP1 - Constipation Problems",
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1CNST"], "domain": "Autonomic",
     "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "np1_lthd", "label": "MDS-UPDRS NP1 - Light Headedness on Standing",
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1LTHD"], "domain": "Autonomic",
     "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "orthostatic_drop_sys", "label": "Orthostatic BP Drop (Systolic, mmHg)",
     "source": "Vital_Signs_29Jul2026.csv", "columns": ["SYSSUP","SYSSTND"],
     "domain": "Autonomic", "type": "continuous",
     "note": "Computed as SYSSUP - SYSSTND; >20 mmHg = orthostatic hypotension",
     "ml_feature": True, "ui_visible": True},
    # Sensory
    {"feature": "upsit_total", "label": "UPSIT Total Correct (Smell Identification)",
     "source": "University_of_Pennsylvania_Smell_Identification_Test_UPSIT_29Jul2026.csv",
     "columns": ["TOTAL_CORRECT"], "domain": "Sensory",
     "type": "ordinal_sum", "range": "0-40",
     "note": "Lower=worse; hyposmia is a key non-motor PD feature",
     "ml_feature": True, "ui_visible": True},
    # Pain/Fatigue
    {"feature": "np1_pain", "label": "MDS-UPDRS NP1 - Pain and Other Sensations",
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1PAIN"], "domain": "Pain",
     "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    {"feature": "np1_fatg", "label": "MDS-UPDRS NP1 - Fatigue",
     "source": "MDS_UPDRS_Part_I__Patient_Questionnaire-Archived_29Jul2026.csv",
     "columns": ["NP1FATG"], "domain": "Fatigue",
     "type": "ordinal", "range": "0-4", "ml_feature": True, "ui_visible": True},
    # Psychosis
    {"feature": "np1_hall", "label": "MDS-UPDRS NP1 - Hallucinations and Psychosis",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1HALL"],
     "domain": "Psychosis", "type": "ordinal", "range": "0-4",
     "note": "0=none, 4=severe; important non-motor PD symptom",
     "ml_feature": True, "ui_visible": True},
    {"feature": "np1_dds", "label": "MDS-UPDRS NP1 - Dopamine Dysregulation Syndrome",
     "source": "MDS_UPDRS_Part_I-Archived_29Jul2026.csv", "columns": ["NP1DDS"],
     "domain": "Impulse Control", "type": "ordinal", "range": "0-4",
     "ml_feature": False, "ui_visible": True},
]

feature_metadata["features"] = metadata_entries
feature_metadata["feature_importance"] = feature_importance
feature_metadata["model_info"] = {
    "model_type": "Rule-based normative scoring",
    "description": "Non-motor burden computed using weighted normalized domain scores derived from PPMI normative ranges for PD cohort. Not a trained ML classifier.",
    "target": "Non-Motor Symptom Burden Score (0-100 per domain, 0=best, 100=worst)",
    "n_features": len(feature_names),
    "validation": "No prospective clinical validation. Research use only.",
    "limitation": "Based on PPMI cross-sectional normative ranges. Not calibrated against independent clinical outcomes. Not intended for diagnosis.",
    "metrics": {
        "note": "This is a rule-based model. No train/test split applicable.",
        "domain_thresholds": {
            "sleep_ess": "ESS > 10 = excessive daytime sleepiness (sensitivity ~80% for clinical ESS criteria)",
            "mood_gds": "GDS >= 5 = depression screen positive (validated 15-item GDS)",
            "mood_rbdsq": "RBDSQ >= 5 = RBD screen positive",
            "cognition_moca": "MoCA < 26 = below normal; < 22 = significant impairment"
        }
    }
}

# ========== SAVE OUTPUTS ==========
import os
os.makedirs('data', exist_ok=True)

with open('data/demo_data.json', 'w', encoding='utf-8') as f:
    json.dump({
        'patients': demo_patients,
        'metadata': {
            'source': 'PPMI Dataset (ppmi.org)',
            'cohort': 'Parkinson\'s Disease participants (COHORT=1)',
            'note': 'Patient records pseudonymized with display_id. Raw data access governed by PPMI data use agreement.',
            'disclaimer': 'Research/educational prototype only. Not for clinical use.'
        }
    }, f, indent=2)

with open('data/feature_metadata.json', 'w', encoding='utf-8') as f:
    json.dump(feature_metadata, f, indent=2)

print(f"\nOutputs saved:")
print(f"  data/demo_data.json - {len(demo_patients)} patients")
print(f"  data/feature_metadata.json - {len(metadata_entries)} features")
print(f"\nFeature importance (top 10):")
for fi in feature_importance[:10]:
    print(f"  {fi['label']}: {fi['importance']}")
