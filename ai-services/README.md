# AURA: AI Services — Disease Risk Prediction & Clinical RAG Triage

Production Machine Learning and Clinical Decision Support (CDS) service for **AURA** (Advanced Unified Responsive Assistant for Medical Emergencies).

---

## 1. Project Purpose & Scope

The `ai-services/` subsystem delivers statistical risk assessment and emergency triage assistance for **Version 2** of the AURA architecture. It operates as a modular, standalone Python service interfacing with the Spring Boot backend (`localhost:8082`) and React frontend (`localhost:5173`).

### ⚠️ Medical Framing & Guardrails
- **Risk Estimation, Not Diagnosis:** AURA computes clinical probability scores to support emergency triage and physician review. It does not provide definitive medical diagnoses.
- **Evidence-Based Cutoffs:** All diagnostic thresholds are standardized against World Health Organization (WHO), American Thyroid Association (ATA), and Centers for Disease Control (CDC) guidelines.

---

## 2. Supported Conditions (7 Locked Diseases — Version 2)

### Group 1: Thyroid Disorders
1. **Hypothyroidism:** TSH > 4.5 mIU/L AND FT4 < 0.8 ng/dL.
2. **Hyperthyroidism:** TSH < 0.4 mIU/L AND FT4 > 1.8 ng/dL.
3. **Subclinical Thyroid Dysfunction:** TSH abnormal (> 4.5 or < 0.4 mIU/L) with normal circulating Free T4.

### Group 2: Vitamin & Nutritional Deficiencies
4. **Iron Deficiency Anemia (IDA):** Hemoglobin < 12 g/dL (Females) / < 13 g/dL (Males) AND MCV < 80 fL (microcytosis).
5. **Vitamin D Deficiency:** Serum 25(OH)D < 20 ng/mL (50 nmol/L).
6. **Vitamin B12 Deficiency:** Serum Cobalamin < 200 pg/mL.
7. **Folate (Vitamin B9) Deficiency:** Serum Folate < 4.0 ng/mL.

---

## 3. Directory Layout

```
ai-services/
├── datasets/
│   ├── raw/                    # Raw untouched CSV data
│   ├── processed/              # Cleaned, anti-leakage train/test splits
│   ├── download_all.py         # Automated data acquisition CLI + sample generator
│   └── DATASET_SOURCES.md      # Complete dataset registry, links, and licenses
├── preprocessing/
│   ├── __init__.py
│   ├── clinical_thresholds.py  # WHO / ATA / CDC medical thresholds
│   ├── preprocess_utils.py     # Anti-leakage scalers, SMOTE, and imputation
│   ├── preprocess_thyroid.py   # Thyroid preprocessing
│   ├── preprocess_anemia.py    # Anemia preprocessing
│   ├── preprocess_vitamin_d.py # Vitamin D preprocessing
│   └── preprocess_vitamin_b12_folate.py # B12 & Folate preprocessing
├── models/
│   ├── thyroid_model.pkl       # Fitted Soft Voting ensemble
│   ├── thyroid_scaler.pkl      # StandardScaler fit strictly on X_train
│   ├── anemia_model.pkl
│   ├── anemia_scaler.pkl
│   ├── vitamin_d_model.pkl
│   ├── vitamin_d_scaler.pkl
│   ├── b12_folate_model.pkl
│   └── b12_folate_scaler.pkl
├── training/
│   ├── __init__.py
│   ├── train_utils.py          # Shared 5-fold CV, soft voting, and plotting
│   ├── train_thyroid.py
│   ├── train_anemia.py
│   ├── train_vitamin_d.py
│   └── train_b12_folate.py
├── evaluation/
│   ├── reports/                # Metrics JSON files (accuracy, precision, recall, F1, ROC-AUC)
│   └── plots/                  # Confusion matrix heatmaps, ROC curves, feature importances
├── chatbot/
│   ├── __init__.py
│   ├── knowledge_base.json     # Curated clinical evidence profiles
│   ├── emergency_keywords.py   # Acute symptom detection & fast triage
│   ├── rag_pipeline.py         # Knowledge retrieval & LLM synthesis
│   └── api.py                  # Production FastAPI service
├── notebooks/
│   └── eda.ipynb               # Exploratory data analysis
├── requirements.txt            # Pinned dependencies
└── README.md
```

---

## 4. Environment Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.10 - 3.14)
- Git

### Installation Steps
```bash
# 1. Navigate to the ai-services directory
cd d:/AURA/-AURA-Advanced-Unified-Responsive-Assistant-For-Medical-Emergencies/ai-services

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (CMD):
.\venv\Scripts\activate.bat
# On Linux / macOS:
source venv/bin/activate

# 4. Install production dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 5. Dataset Acquisition Protocol

### Automated Setup & Sample Generation
To immediately test the entire pipeline without waiting for manual downloads:
```bash
python datasets/download_all.py --generate-samples
```

### Manual Download Checklist & Credentials
See `datasets/DATASET_SOURCES.md` for full URLs and licenses.

1. **UCI Thyroid Disease:**
   - Link: `https://archive.ics.uci.edu/dataset/102/thyroid+disease`
   - Access: Direct download (No account).
   - Save to: `datasets/raw/thyroid_raw.csv`.

2. **Mendeley Anemia Dataset:**
   - Link: `https://data.mendeley.com/datasets/y7v7ff3wpj/1`
   - Access: Free Mendeley login required.
   - Save to: `datasets/raw/anemia_raw.csv`.

3. **NHANES 25(OH)D Vitamin D Cohort:**
   - Link: `https://figshare.com/articles/dataset/Raw_data/29638243`
   - Access: Direct open download.
   - Save to: `datasets/raw/vitamin_d_raw.csv`.

4. **CDC NHANES B12 & Folate:**
   - Link: `https://wwwn.cdc.gov/Nchs/Nhanes/`
   - Access: US Open Government public domain.
   - Save to: `datasets/raw/b12_folate_raw.csv`.

5. **Kaggle Multiclass Vitamin Dataset:**
   - Link: `https://www.kaggle.com/datasets/butchamagaimperial/cleaned-vitamin-deficiency-disease-dataset`
   - Access: Kaggle API token in `~/.kaggle/kaggle.json`.
   - Run: `python datasets/download_all.py --download-all`.

---

## 6. Pipeline Execution: Preprocessing → Training → Evaluation

Execute all steps sequentially from the `ai-services/` root:

### Step 1: Preprocessing (Enforces Zero Data Leakage)
```bash
python preprocessing/preprocess_thyroid.py
python preprocessing/preprocess_anemia.py
python preprocessing/preprocess_vitamin_d.py
python preprocessing/preprocess_vitamin_b12_folate.py
```
*What this does:*
- Imputes missing numerical features with MEDIAN, categorical with MODE.
- Splits data 80/20 with `stratify=y`.
- Fits `StandardScaler` strictly on `X_train` and persists to `models/<disease>_scaler.pkl`.
- Applies SMOTE strictly to the training partition if imbalance > 3:1.

### Step 2: Model Training & Evaluation
```bash
python training/train_thyroid.py
python training/train_anemia.py
python training/train_vitamin_d.py
python training/train_b12_folate.py
```
*What this does:*
- Trains a Soft Voting Classifier combining Random Forest (100 estimators), XGBoost (100 estimators), and Support Vector Classifier (`probability=True`).
- Runs 5-Fold Stratified Cross-Validation on the training set.
- Evaluates the held-out test partition across Accuracy, Precision, Recall, F1, and ROC-AUC.
- Generates confusion matrix heatmaps, ROC curves, and feature importance charts in `evaluation/plots/`.
- Saves metrics JSON in `evaluation/reports/`.
- Serializes trained ensemble models to `models/<disease>_model.pkl`.

---

## 7. Starting the API Microservice

Launch the unified FastAPI server:
```bash
python chatbot/api.py
```
Or with Uvicorn:
```bash
uvicorn chatbot.api:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API Documentation is accessible at:
👉 **`http://localhost:8000/docs`**

---

## 8. Clinical Predictor Reference

| Condition | Required Input Features | Output Target |
|---|---|---|
| **Thyroid Dysfunction** | `age`, `sex`, `on_thyroxine`, `query_hypothyroid`, `query_hyperthyroid`, `sick`, `pregnant`, `goitre`, `TSH`, `T3`, `TT4`, `FT4` | 0: Normal, 1: Hypothyroid, 2: Hyperthyroid, 3: Subclinical |
| **Iron Deficiency Anemia** | `Gender`, `Hemoglobin`, `MCH`, `MCHC`, `MCV` | 0: Healthy, 1: Iron Deficiency Anemia |
| **Vitamin D Deficiency** | `age`, `gender`, `bmi`, `sun_exposure_hours`, `takes_supplement` | 0: Sufficient, 1: Vitamin D Deficient |
| **B12 & Folate Deficiency**| `age`, `gender`, `diet_type` (vegan/veg/omnivore), `mcv`, `hemoglobin` | 0: Sufficient, 1: B12 Deficient, 2: Folate Deficient, 3: Combined |

---

## 9. Known Limitations & Research Boundaries

1. **Decision Support Only:** Statistical predictions should never supersede qualified clinical evaluation or definitive laboratory tests.
2. **Biomarker Exclusions to Prevent Trivial Leakage:** In nutritional deficiency models, the continuous target analyte (e.g. serum 25(OH)D, serum B12) is deliberately omitted from predictors to ensure the model learns from clinical surrogates (CBC markers, demographics, lifestyle).
3. **Threshold Boundary Sensitivities:** Borderline clinical ranges (e.g., TSH 4.0 - 5.0 mIU/L or B12 200 - 300 pg/mL) require secondary confirmatory testing (anti-TPO antibodies or methylmalonic acid).
