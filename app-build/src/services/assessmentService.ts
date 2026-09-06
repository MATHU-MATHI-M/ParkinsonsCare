// NeuroCare Non-Motor Assessment Service
// Covers all 35 non-motor features in the PPMI dataset across 5 clinical domains
// Plain English, zero clinical jargon, intuitive for patients

export interface NonMotorQuestion {
  id: string;
  featureKey: string;
  domain: 'Cognition' | 'Sleep' | 'Mood' | 'Autonomic' | 'Sensory';
  domainLabel: string;
  domainIcon: string;
  title: string;
  subtitle: string;
  defaultValue: number;
  options: {
    label: string;
    description?: string;
    value: number;
  }[];
}

export const NON_MOTOR_DOMAINS = [
  { key: 'Cognition', label: 'Memory & Thinking', icon: '🧠', desc: 'Thinking speed, focus, and memory recall' },
  { key: 'Sleep', label: 'Sleep & Nighttime', icon: '🌙', desc: 'Restful sleep, daytime alertness, and dreams' },
  { key: 'Mood', label: 'Mood & Energy', icon: '☀️', desc: 'Emotional wellbeing, motivation, and calmness' },
  { key: 'Autonomic', label: 'Body & Digestion', icon: '🫀', desc: 'Digestive comfort, bladder, and blood pressure' },
  { key: 'Sensory', label: 'Senses & Fatigue', icon: '👃', desc: 'Sense of smell, energy stamina, and discomfort' },
] as const;

export const NON_MOTOR_QUESTIONS: NonMotorQuestion[] = [
  // ==========================================
  // DOMAIN 1: COGNITION & MEMORY (10 PPMI features)
  // ==========================================
  {
    id: 'cog_np1',
    featureKey: 'np1_cog',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Daily Memory & Thinking',
    subtitle: 'Do you have trouble remembering names, dates, or following conversations?',
    defaultValue: 0,
    options: [
      { label: 'Normal', description: 'No memory or thinking difficulties', value: 0 },
      { label: 'Slight', description: 'Occasional brief slips, no impact on daily life', value: 1 },
      { label: 'Mild', description: 'Noticeable forgetfulness, takes longer to solve tasks', value: 2 },
      { label: 'Moderate', description: 'Frequently forgetful, difficulty with complex tasks', value: 3 },
    ],
  },
  {
    id: 'cog_moca',
    featureKey: 'moca_total',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Overall Cognitive Sharpness',
    subtitle: 'How would you rate your mental clarity, problem-solving, and attention?',
    defaultValue: 28,
    options: [
      { label: 'Sharp & Clear', description: 'Quick thinking, clear mind (Normal: 26–30)', value: 28 },
      { label: 'Mild Lapses', description: 'Minor lapses remembering details (24–25)', value: 25 },
      { label: 'Noticeable Difficulty', description: 'Frequent confusion or trouble with finances/bills (20–23)', value: 21 },
      { label: 'Significant Need', description: 'Needs regular reminders for daily routines (<20)', value: 18 },
    ],
  },
  {
    id: 'cog_sdmt',
    featureKey: 'sdmt_total',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Mental Processing Speed',
    subtitle: 'How fast can your brain process new information or instructions?',
    defaultValue: 48,
    options: [
      { label: 'Quick / Normal', description: 'Normal response speed (>45)', value: 48 },
      { label: 'A Bit Slowed', description: 'Take extra time to grasp multi-step instructions (38–44)', value: 40 },
      { label: 'Noticeably Slow', description: 'Takes considerable time to process conversations (<35)', value: 30 },
    ],
  },
  {
    id: 'cog_hvlt',
    featureKey: 'hvlt_total_recall',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Word List & Story Recall',
    subtitle: 'Can you easily recall a list of groceries or a story after a 20-minute delay?',
    defaultValue: 52,
    options: [
      { label: 'Good Recall', description: 'Remember items and details accurately', value: 52 },
      { label: 'Need Hints', description: 'Remember most things if given a hint or clue', value: 44 },
      { label: 'Poor Recall', description: 'Frequently cannot recall what was discussed earlier', value: 36 },
    ],
  },
  {
    id: 'cog_fluency',
    featureKey: 'lexical_fluency_total',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Finding Words in Conversation',
    subtitle: 'Do you ever have "tip-of-the-tongue" pauses searching for the right word?',
    defaultValue: 45,
    options: [
      { label: 'Fluent', description: 'Words come naturally without pause', value: 45 },
      { label: 'Occasional Pauses', description: 'Occasional pause to find the exact word', value: 38 },
      { label: 'Frequent Hesitations', description: 'Often stop mid-sentence searching for words', value: 28 },
    ],
  },
  {
    id: 'cog_tmtb',
    featureKey: 'tmt_b_sec',
    domain: 'Cognition',
    domainLabel: 'Memory & Thinking',
    domainIcon: '🧠',
    title: 'Multi-Tasking & Switching Steps',
    subtitle: 'How easily can you switch back and forth between two tasks without confusion?',
    defaultValue: 75,
    options: [
      { label: 'Easy / Normal', description: 'Smoothly switch tasks (Fast: <80s)', value: 75 },
      { label: 'Requires Focus', description: 'Need full concentration, slower to switch (90–110s)', value: 100 },
      { label: 'Easily Disoriented', description: 'Easily lose track when interrupted (>120s)', value: 135 },
    ],
  },

  // ==========================================
  // DOMAIN 2: SLEEP & NIGHTTIME (3 PPMI features)
  // ==========================================
  {
    id: 'slp_night',
    featureKey: 'np1_slpn',
    domain: 'Sleep',
    domainLabel: 'Sleep & Nighttime',
    domainIcon: '🌙',
    title: 'Nighttime Sleep Quality',
    subtitle: 'Over the past month, have you had trouble falling asleep or staying asleep?',
    defaultValue: 0,
    options: [
      { label: 'Sound Sleep', description: 'Sleep well through the night', value: 0 },
      { label: 'Mild Waking', description: 'Wake up 1–2 times, fall back asleep easily', value: 1 },
      { label: 'Moderate Disruption', description: 'Awake for over an hour during the night', value: 2 },
      { label: 'Severe Insomnia', description: 'Awake for 2+ hours most nights, exhausted in morning', value: 3 },
    ],
  },
  {
    id: 'slp_day',
    featureKey: 'np1_slpd',
    domain: 'Sleep',
    domainLabel: 'Sleep & Nighttime',
    domainIcon: '🌙',
    title: 'Daytime Drowsiness',
    subtitle: 'Do you feel excessively sleepy or struggle to stay awake during the day?',
    defaultValue: 0,
    options: [
      { label: 'Alert All Day', description: 'Feel awake and alert throughout the day', value: 0 },
      { label: 'Afternoon Slump', description: 'Slightly sleepy after lunch, but stay awake', value: 1 },
      { label: 'Doze Off Easily', description: 'Doze off when reading or watching television', value: 2 },
      { label: 'Uncontrollable Drowsiness', description: 'Struggle to stay awake during meals or conversations', value: 3 },
    ],
  },
  {
    id: 'slp_ess',
    featureKey: 'ess_score',
    domain: 'Sleep',
    domainLabel: 'Sleep & Nighttime',
    domainIcon: '🌙',
    title: 'Daytime Dozing Likelihood',
    subtitle: 'How likely are you to doze off sitting quietly in public places or as a car passenger?',
    defaultValue: 5,
    options: [
      { label: 'Never / Low', description: 'Would never or rarely doze off (Normal: 0–7)', value: 5 },
      { label: 'Slight Chance', description: 'Slight chance in quiet environments (8–10)', value: 9 },
      { label: 'Moderate Chance', description: 'Moderate chance of falling asleep (11–14)', value: 12 },
      { label: 'High Chance', description: 'High chance of dozing off frequently (15+)', value: 16 },
    ],
  },
  {
    id: 'slp_rbd',
    featureKey: 'rbdsq_score',
    domain: 'Sleep',
    domainLabel: 'Sleep & Nighttime',
    domainIcon: '🌙',
    title: 'Dream Enactment & Vivid Dreams',
    subtitle: 'Have you ever shouted, thrashed, punched, or kicked in bed while dreaming?',
    defaultValue: 1,
    options: [
      { label: 'Quiet Sleeper', description: 'Calm sleep, no physical dream enactment (0–2)', value: 1 },
      { label: 'Occasional Movements', description: 'Occasional twitching, talking, or restless dreams (3–4)', value: 3 },
      { label: 'Frequent Dream Enactment', description: 'Frequently shout, kick, or flail during dreams (5+)', value: 6 },
    ],
  },

  // ==========================================
  // DOMAIN 3: MOOD, ANXIETY & MOTIVATION (6 PPMI features)
  // ==========================================
  {
    id: 'mood_dprs',
    featureKey: 'np1_dprs',
    domain: 'Mood',
    domainLabel: 'Mood & Energy',
    domainIcon: '☀️',
    title: 'Daily Mood & Low Spirits',
    subtitle: 'Over the past month, have you felt sad, down, or low in spirits?',
    defaultValue: 0,
    options: [
      { label: 'Normal / Cheerful', description: 'Generally cheerful and positive', value: 0 },
      { label: 'Occasional Lows', description: 'Brief periods of feeling blue that pass quickly', value: 1 },
      { label: 'Persistent Sadness', description: 'Down for several days at a time, hard to cheer up', value: 2 },
      { label: 'Depressed', description: 'Deep, persistent sadness most days', value: 3 },
    ],
  },
  {
    id: 'mood_anxs',
    featureKey: 'np1_anxs',
    domain: 'Mood',
    domainLabel: 'Mood & Energy',
    domainIcon: '☀️',
    title: 'Anxiety & Nervous Tension',
    subtitle: 'Do you feel anxious, jittery, or excessively worried about the future?',
    defaultValue: 0,
    options: [
      { label: 'Calm & Relaxed', description: 'Feel relaxed and at peace', value: 0 },
      { label: 'Occasional Worry', description: 'Occasional mild worry about daily events', value: 1 },
      { label: 'Frequent Tension', description: 'Regular feeling of inner restlessness or nervousness', value: 2 },
      { label: 'Severe Anxiety', description: 'Frequent severe anxiety or panic sensations', value: 3 },
    ],
  },
  {
    id: 'mood_apat',
    featureKey: 'np1_apat',
    domain: 'Mood',
    domainLabel: 'Mood & Energy',
    domainIcon: '☀️',
    title: 'Motivation & Drive (Apathy)',
    subtitle: 'Do you have enthusiasm to engage with friends, family, or hobbies?',
    defaultValue: 0,
    options: [
      { label: 'Full of Drive', description: 'Eager to pursue hobbies and spend time with others', value: 0 },
      { label: 'A Bit Sluggish', description: 'Need a small push from family to start projects', value: 1 },
      { label: 'Loss of Interest', description: 'Lost interest in activities that used to be enjoyable', value: 2 },
      { label: 'Severe Apathy', description: 'Spend most of the day inactive with no desire to do things', value: 3 },
    ],
  },
  {
    id: 'mood_hall',
    featureKey: 'np1_hall',
    domain: 'Mood',
    domainLabel: 'Mood & Energy',
    domainIcon: '☀️',
    title: 'Unusual Perceptions or Shadows',
    subtitle: 'Have you seen shadows, animals, or felt a presence that was not actually there?',
    defaultValue: 0,
    options: [
      { label: 'Never', description: 'Perceptions are completely accurate', value: 0 },
      { label: 'Brief Shadows', description: 'Briefly glimpse a shadow or sense someone nearby', value: 1 },
      { label: 'Formed Figures', description: 'Clearly see people, animals, or objects not present', value: 2 },
    ],
  },
  {
    id: 'mood_gds',
    featureKey: 'gds_score',
    domain: 'Mood',
    domainLabel: 'Mood & Energy',
    domainIcon: '☀️',
    title: 'Life Satisfaction Screen',
    subtitle: 'Do you generally feel that your life is meaningful and hopeful?',
    defaultValue: 1,
    options: [
      { label: 'Satisfied & Hopeful', description: 'Generally content and hopeful (Score: 0–3)', value: 1 },
      { label: 'Sometimes Discouraged', description: 'Occasional feeling of emptiness (4–6)', value: 4 },
      { label: 'Often Down', description: 'Frequently feel life lacks direction or joy (7+)', value: 8 },
    ],
  },

  // ==========================================
  // DOMAIN 4: BODY & AUTONOMIC SYSTEMS (9 PPMI features)
  // ==========================================
  {
    id: 'aut_cnst',
    featureKey: 'np1_cnst',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Digestion & Bowel Sluggishness',
    subtitle: 'Do you experience constipation or delayed bowel movements?',
    defaultValue: 0,
    options: [
      { label: 'Regular & Normal', description: 'Daily comfortable bowel movements', value: 0 },
      { label: 'Mild Constipation', description: 'Go every 2–3 days without medications', value: 1 },
      { label: 'Moderate Constipation', description: 'Require fiber supplements or occasional laxatives', value: 2 },
      { label: 'Severe Constipation', description: 'Severe constipation requiring regular treatment', value: 3 },
    ],
  },
  {
    id: 'aut_urin',
    featureKey: 'np1_urin',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Bladder Control & Urgency',
    subtitle: 'Do you experience a sudden, strong urge to urinate or wake up frequently at night?',
    defaultValue: 0,
    options: [
      { label: 'Normal Control', description: 'Normal bladder function, wake 0–1 times at night', value: 0 },
      { label: 'Occasional Urgency', description: 'Occasionally have to rush, wake 1–2 times at night', value: 1 },
      { label: 'Frequent Urgency', description: 'Frequent urgent need, wake 2–3 times at night', value: 2 },
      { label: 'Severe Urgency', description: 'Occasional leakage or wake 4+ times at night', value: 3 },
    ],
  },
  {
    id: 'aut_lthd',
    featureKey: 'np1_lthd',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Dizziness When Standing Up',
    subtitle: 'Do you feel dizzy, lightheaded, or unsteady when getting up from a chair or bed?',
    defaultValue: 0,
    options: [
      { label: 'No Dizziness', description: 'Rise quickly and steadily without lightheadedness', value: 0 },
      { label: 'Slight Lightheadedness', description: 'Brief lightheadedness that passes in 5 seconds', value: 1 },
      { label: 'Need to Hold Furniture', description: 'Need to pause and hold furniture to stabilize', value: 2 },
      { label: 'Near Fainting', description: 'Severe dizziness, blackouts, or need to sit back down', value: 3 },
    ],
  },
  {
    id: 'aut_gi',
    featureKey: 'scopa_gi',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Stomach Comfort & Fullness',
    subtitle: 'Do you get full too quickly when eating, or suffer from heartburn or bloating?',
    defaultValue: 2,
    options: [
      { label: 'Normal Digestion', description: 'Good appetite, no unusual bloating or fullness', value: 2 },
      { label: 'Mild Reflux / Fullness', description: 'Occasional early fullness or mild acid reflux', value: 5 },
      { label: 'Frequent Discomfort', description: 'Noticeable nausea, heavy fullness after small meals', value: 9 },
    ],
  },
  {
    id: 'aut_thermo',
    featureKey: 'scopa_thermoregulatory',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Temperature & Sweating',
    subtitle: 'Do you experience sudden episodes of heavy sweating or unusual cold sensitivity?',
    defaultValue: 1,
    options: [
      { label: 'Comfortable', description: 'Normal temperature regulation', value: 1 },
      { label: 'Occasional Sweating', description: 'Occasional unprovoked sweating or chills', value: 3 },
      { label: 'Heavy Sweats / Chills', description: 'Frequent intense sweating or extreme cold sensitivity', value: 6 },
    ],
  },
  {
    id: 'aut_ortho',
    featureKey: 'orthostatic_drop_sys',
    domain: 'Autonomic',
    domainLabel: 'Body & Digestion',
    domainIcon: '🫀',
    title: 'Standing Blood Pressure Shift',
    subtitle: 'Has a doctor measured your blood pressure dropping when moving from sitting to standing?',
    defaultValue: 5,
    options: [
      { label: 'Normal / Stable', description: 'Blood pressure stays steady (Drop < 10 mmHg)', value: 5 },
      { label: 'Mild Drop', description: 'Mild drop upon standing (10–19 mmHg)', value: 12 },
      { label: 'Marked Drop', description: 'Significant drop (≥20 mmHg, Orthostatic Hypotension)', value: 24 },
    ],
  },

  // ==========================================
  // DOMAIN 5: SENSES, PAIN & VITALITY (5 PPMI features)
  // ==========================================
  {
    id: 'sen_smell',
    featureKey: 'upsit_total',
    domain: 'Sensory',
    domainLabel: 'Senses & Fatigue',
    domainIcon: '👃',
    title: 'Sense of Smell',
    subtitle: 'How well can you detect pleasant aromas like coffee, flowers, or food spices?',
    defaultValue: 35,
    options: [
      { label: 'Normal & Sharp', description: 'Detect and identify aromas easily (34–40)', value: 35 },
      { label: 'Mild Reduction', description: 'Notice slight fading of subtle scents (26–33)', value: 28 },
      { label: 'Substantial Loss', description: 'Can only smell very strong scents (19–25)', value: 21 },
      { label: 'Complete Loss', description: 'Cannot smell food or aromas at all (<19)', value: 14 },
    ],
  },
  {
    id: 'sen_pain',
    featureKey: 'np1_pain',
    domain: 'Sensory',
    domainLabel: 'Senses & Fatigue',
    domainIcon: '👃',
    title: 'Unexplained Body Aches or Cramping',
    subtitle: 'Do you suffer from deep muscle aches, tightness, or cramping in arms or legs?',
    defaultValue: 0,
    options: [
      { label: 'No Pain', description: 'No unusual muscle aches or cramping', value: 0 },
      { label: 'Mild Aches', description: 'Occasional mild muscle tension or stiffness', value: 1 },
      { label: 'Noticeable Pain', description: 'Frequent uncomfortable aching or cramping', value: 2 },
      { label: 'Severe Discomfort', description: 'Persistent aching that interferes with daily tasks', value: 3 },
    ],
  },
  {
    id: 'sen_fatg',
    featureKey: 'np1_fatg',
    domain: 'Sensory',
    domainLabel: 'Senses & Fatigue',
    domainIcon: '👃',
    title: 'Daily Energy & Fatigue',
    subtitle: 'Do you feel a deep, overwhelming exhaustion that is not relieved by rest?',
    defaultValue: 0,
    options: [
      { label: 'Good Stamina', description: 'Normal daily energy levels', value: 0 },
      { label: 'Tire Easily', description: 'Tire a bit faster by late afternoon', value: 1 },
      { label: 'Need Daily Rest', description: 'Require rest periods to get through the day', value: 2 },
      { label: 'Overwhelming Fatigue', description: 'Heavy physical exhaustion stopping activities', value: 3 },
    ],
  },
  {
    id: 'sen_pulse',
    featureKey: 'hr_supine',
    domain: 'Sensory',
    domainLabel: 'Senses & Fatigue',
    domainIcon: '👃',
    title: 'Resting Pulse Rate',
    subtitle: 'What is your typical resting pulse rate when seated quietly?',
    defaultValue: 72,
    options: [
      { label: 'Normal (60–80 bpm)', description: 'Calm, steady resting pulse', value: 72 },
      { label: 'Slightly Rapid (81–95 bpm)', description: 'Faster resting heartbeat', value: 86 },
      { label: 'Elevated (>95 bpm)', description: 'Consistently rapid heart rate', value: 100 },
    ],
  },
];

// Backward-compatibility export
export const ASSESSMENT_QUESTIONS = NON_MOTOR_QUESTIONS.map(q => ({
  id: q.id,
  domain: q.domain,
  question: q.subtitle ? `${q.title}: ${q.subtitle}` : q.title,
  options: q.options,
}));
