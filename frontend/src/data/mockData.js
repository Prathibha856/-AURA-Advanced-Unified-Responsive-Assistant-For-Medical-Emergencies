/**
 * AURA Mock Data Repository
 * 
 * Provides structured frontend mock data for disease prediction,
 * medical health profiles, nearby hospital locator, emergency responses,
 * and chatbot recommendations.
 * 
 * Configured as clean placeholders ready for Spring Boot REST endpoints.
 */

// 1. Clinical Symptom Database
export const MOCK_SYMPTOMS = [
  { id: 'sym-01', name: 'Fever', category: 'General', common: true, severity: 'Moderate' },
  { id: 'sym-02', name: 'Dry Cough', category: 'Respiratory', common: true, severity: 'Mild' },
  { id: 'sym-03', name: 'Fatigue / Tiredness', category: 'General', common: true, severity: 'Mild' },
  { id: 'sym-04', name: 'Shortness of Breath', category: 'Respiratory', common: true, severity: 'High' },
  { id: 'sym-05', name: 'Chest Tightness or Pain', category: 'Cardiovascular', common: true, severity: 'High' },
  { id: 'sym-06', name: 'Severe Headache', category: 'Neurological', common: true, severity: 'Moderate' },
  { id: 'sym-07', name: 'Sore Throat', category: 'Respiratory', common: true, severity: 'Mild' },
  { id: 'sym-08', name: 'Nausea & Vomiting', category: 'Digestive', common: false, severity: 'Moderate' },
  { id: 'sym-09', name: 'Abdominal Cramps', category: 'Digestive', common: false, severity: 'Moderate' },
  { id: 'sym-10', name: 'Dizziness / Lightheadedness', category: 'Neurological', common: true, severity: 'Moderate' },
  { id: 'sym-11', name: 'Loss of Taste or Smell', category: 'Neurological', common: true, severity: 'Mild' },
  { id: 'sym-12', name: 'Skin Rash or Lesions', category: 'Skin', common: false, severity: 'Mild' },
  { id: 'sym-13', name: 'Joint & Muscle Aches', category: 'Musculoskeletal', common: true, severity: 'Moderate' },
  { id: 'sym-14', name: 'Chills & Night Sweats', category: 'General', common: true, severity: 'Moderate' },
  { id: 'sym-15', name: 'Nasal Congestion / Runny Nose', category: 'Respiratory', common: true, severity: 'Mild' },
  { id: 'sym-16', name: 'Palpitations / Rapid Heartbeat', category: 'Cardiovascular', common: false, severity: 'High' },
  { id: 'sym-17', name: 'Diarrhea', category: 'Digestive', common: false, severity: 'Moderate' },
  { id: 'sym-18', name: 'Swollen Lymph Nodes', category: 'General', common: false, severity: 'Mild' },
  { id: 'sym-19', name: 'High Blood Pressure Spikes', category: 'Cardiovascular', common: false, severity: 'High' },
  { id: 'sym-20', name: 'Blurry Vision', category: 'Neurological', common: false, severity: 'Moderate' },
];

export const SYMPTOM_CATEGORIES = [
  'All',
  'General',
  'Respiratory',
  'Digestive',
  'Neurological',
  'Cardiovascular',
  'Skin',
  'Musculoskeletal',
];

// 2. Mock Prediction History Records
export const MOCK_PREDICTION_HISTORY = [
  {
    id: 'PRED-2026-8942',
    date: '2026-08-20',
    time: '14:32',
    predictedCondition: 'Acute Upper Respiratory Infection',
    confidence: 88,
    riskLevel: 'Low Attention',
    urgencyColor: 'blue',
    symptomsCount: 3,
    symptoms: ['Dry Cough', 'Fever', 'Sore Throat'],
    description: 'A viral infection affecting the nasal passages, throat, and bronchi. Commonly resolves with rest and symptomatic treatment.',
    precautions: [
      'Maintain hydration with warm fluids and water.',
      'Rest adequately for 48-72 hours.',
      'Monitor temperature and seek doctor if fever exceeds 102°F (38.9°C).'
    ],
    recommendedActions: [
      'Monitor symptoms at home.',
      'Consult primary care provider if cough persists > 7 days.',
      'Avoid close contact with others to limit spread.'
    ]
  },
  {
    id: 'PRED-2026-7811',
    date: '2026-08-12',
    time: '09:15',
    predictedCondition: 'Tension Headache / Migraine Variant',
    confidence: 76,
    riskLevel: 'Moderate Attention',
    urgencyColor: 'amber',
    symptomsCount: 2,
    symptoms: ['Severe Headache', 'Dizziness / Lightheadedness'],
    description: 'Neurological response frequently linked to stress, sleep disruption, or dehydration.',
    precautions: [
      'Rest in a quiet, dark room.',
      'Stay hydrated and avoid high caffeine intake.',
      'Keep a migraine trigger diary.'
    ],
    recommendedActions: [
      'Schedule a routine physician consultation.',
      'Track onset frequency and pain intensity.'
    ]
  },
  {
    id: 'PRED-2026-6105',
    date: '2026-07-28',
    time: '18:45',
    predictedCondition: 'Acute Gastroenteritis',
    confidence: 82,
    riskLevel: 'Moderate Attention',
    urgencyColor: 'amber',
    symptomsCount: 3,
    symptoms: ['Nausea & Vomiting', 'Abdominal Cramps', 'Diarrhea'],
    description: 'Inflammation of the stomach and intestines typically caused by viral or bacterial pathogen ingestion.',
    precautions: [
      'Replenish electrolytes using Oral Rehydration Salts (ORS).',
      'Follow a bland diet (BRAT: Bananas, Rice, Applesauce, Toast).',
      'Wash hands frequently.'
    ],
    recommendedActions: [
      'Consult a physician if unable to keep fluids down for 24h.',
      'Watch for signs of dehydration (dark urine, dry mouth).'
    ]
  }
];

// 3. Mock Medical Health Profile
export const MOCK_HEALTH_PROFILE = {
  personalInfo: {
    fullName: 'Sarah Jenkins',
    age: 29,
    gender: 'Female',
    bloodGroup: 'O Positive (O+)',
    height: '168 cm',
    weight: '62 kg',
    bmi: '22.0 (Normal)',
  },
  medicalHistory: [
    { condition: 'Mild Asthma', diagnosedYear: 2018, status: 'Managed' },
    { condition: 'Seasonal Allergic Rhinitis', diagnosedYear: 2020, status: 'Active' },
  ],
  allergies: [
    { allergen: 'Penicillin', severity: 'Severe (Anaphylaxis risk)' },
    { allergen: 'Tree Pollen', severity: 'Mild (Seasonal sneezes)' },
  ],
  medications: [
    { name: 'Albuterol Inhaler', dosage: '90mcg', frequency: 'As needed for wheezing' },
    { name: 'Cetirizine (Zyrtec)', dosage: '10mg', frequency: 'Daily during spring/fall' },
  ],
  emergencyContacts: [
    { name: 'David Jenkins', relationship: 'Spouse', phone: '+1 (555) 234-5678' },
    { name: 'Dr. Emily Carter', relationship: 'Primary Care Physician', phone: '+1 (555) 987-6543' },
  ],
  healthNotes: 'Patient prefers telehealth consultations for mild respiratory follow-ups. Allergic reaction to Penicillin verified in 2019.',
};

// 4. Mock Nearby Hospitals Database
export const MOCK_HOSPITALS = [
  {
    id: 'hosp-101',
    name: 'St. Jude Emergency & Specialty Hospital',
    distanceKm: 1.8,
    travelTimeMins: 6,
    address: '450 Health Sciences Parkway, Metro City',
    phone: '+1 (800) 555-0199',
    emergency247: true,
    icuAvailable: 12,
    traumaCenter: 'Level 1 Trauma',
    rating: 4.9,
    reviewsCount: 420,
    coordinates: { lat: 37.7749, lng: -122.4194 },
    openBeds: 28,
  },
  {
    id: 'hosp-102',
    name: 'AURA Memorial Health Center',
    distanceKm: 3.4,
    travelTimeMins: 11,
    address: '820 Innovation Way, Suite 100',
    phone: '+1 (800) 555-0244',
    emergency247: true,
    icuAvailable: 7,
    traumaCenter: 'Level 2 Trauma',
    rating: 4.8,
    reviewsCount: 310,
    coordinates: { lat: 37.7833, lng: -122.4167 },
    openBeds: 15,
  },
  {
    id: 'hosp-103',
    name: 'Valley Care Cardiac & Urgent Clinic',
    distanceKm: 5.2,
    travelTimeMins: 15,
    address: '1120 Valley Boulevard, North District',
    phone: '+1 (800) 555-0388',
    emergency247: true,
    icuAvailable: 4,
    traumaCenter: 'Urgent Care & Cardiac',
    rating: 4.7,
    reviewsCount: 195,
    coordinates: { lat: 37.7650, lng: -122.4300 },
    openBeds: 9,
  },
  {
    id: 'hosp-104',
    name: 'Metropolitan General Children & Family Hospital',
    distanceKm: 7.9,
    travelTimeMins: 22,
    address: '2300 General Hospital Drive',
    phone: '+1 (800) 555-0711',
    emergency247: true,
    icuAvailable: 18,
    traumaCenter: 'Pediatric & Adult Level 1',
    rating: 4.9,
    reviewsCount: 680,
    coordinates: { lat: 37.7500, lng: -122.4050 },
    openBeds: 42,
  },
  {
    id: 'hosp-105',
    name: 'Sunrise Community Urgent Care Clinic',
    distanceKm: 11.5,
    travelTimeMins: 28,
    address: '945 Sunrise Highway, East Sector',
    phone: '+1 (800) 555-0899',
    emergency247: false,
    icuAvailable: 0,
    traumaCenter: 'Walk-in Urgent Care',
    rating: 4.5,
    reviewsCount: 140,
    coordinates: { lat: 37.7300, lng: -122.3900 },
    openBeds: 5,
  },
];

// 5. Bot Intelligent Mock Responses
export const MOCK_BOT_RESPONSES = [
  {
    keywords: ['symptom', 'fever', 'cough', 'pain', 'headache', 'check'],
    response: "I can help analyze your symptoms using AURA's clinical risk engine! You can select symptoms on our Disease Prediction module to get a risk-categorized report.",
    actionLink: '/predict',
    actionText: 'Go to Disease Prediction',
  },
  {
    keywords: ['hospital', 'clinic', 'nearby', 'doctor', 'distance', 'icu', 'location'],
    response: "You can find nearby emergency hospitals with real-time ICU bed availability, estimated travel times, and direct contact numbers.",
    actionLink: '/hospitals',
    actionText: 'Find Nearby Hospitals',
  },
  {
    keywords: ['emergency', 'sos', 'ambulance', '911', 'urgent', 'help', 'chest pain'],
    response: "If you or someone nearby is experiencing a life-threatening emergency, please trigger our Emergency SOS immediately or call local emergency dispatch.",
    actionLink: '/emergency',
    actionText: 'Trigger Emergency SOS',
  },
  {
    keywords: ['profile', 'medical', 'history', 'allergy', 'medication', 'record'],
    response: "You can view and update your secure Medical Information profile, including chronic conditions, active medications, and emergency contacts.",
    actionLink: '/patient/medical-information',
    actionText: 'View Health Profile',
  },
  {
    keywords: ['prediction', 'result', 'report', 'explain', 'risk'],
    response: "AURA provides detailed health reports with confidence scores, risk categories, precautions, and actionable next steps.",
    actionLink: '/patient/dashboard',
    actionText: 'View Dashboard & History',
  },
];
