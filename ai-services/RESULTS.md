\# AURA Disease Prediction — Results Summary



\## 9 Trained Models Across 3 Modules



\### Module 1 — Blood \& Nutritional Disorders

| Model | Accuracy | F1 (W) | ROC-AUC |

|---|---|---|---|

| Anemia (Kaggle) | 62.11% | 0.623 | 0.623 |

| Anemia (Mendeley) | 60.00% | 0.509 | 0.620 |

| Vitamin Deficiency (5-class) | 91.38% | 0.915 | 0.990 |



\### Module 2 — Thyroid \& Metabolic

| Model | Accuracy | F1 (W) | ROC-AUC |

|---|---|---|---|

| Thyroid (4-class) | 90.22% | 0.912 | 0.884 |

| Diabetes Pima | 75.32% | 0.750 | 0.812 |

| Diabetes BRFSS (3-class) | 84.41% | 0.820 | 0.811 |



\### Module 3 — Cardiovascular \& Kidney

| Model | Accuracy | F1 (W) | ROC-AUC |

|---|---|---|---|

| Liver Disease | 62.39% | 0.583 | 0.627 |

| Heart Disease | 98.54% | 0.985 | 0.994 |

| CKD | 100.00% | 1.000 | 1.000 |



\### Module 4 — Systemic \& Immune

\*\*No models trained.\*\* The available gastrointestinal dataset had symptom 

categories (abdominal pain, bloating, etc.) as the target column, not disease 

labels. Model accuracy was 16.4% (worse than random). Excluded from analysis.



\## Known Limitations



\- \*\*Anemia models (60-62%)\*\*: Only 1 non-leaky feature remains after dropping 

&#x20; Hb/MCV/MCH/MCHC (label-defining). Reported as negative result.



\- \*\*Heart (98.5%) and CKD (100%)\*\*: These datasets are well-documented as 

&#x20; trivially classifiable in the literature. Noted as dataset characteristics.



\- \*\*Liver (62%)\*\*: Genuine class overlap in the UCI ILPD dataset.



\## Reproducing



python modules/blood\_nutrition/preprocess.py \&\& python modules/blood\_nutrition/train.py

python modules/thyroid\_metabolic/preprocess.py \&\& python modules/thyroid\_metabolic/train.py

python modules/cardio\_kidney/preprocess.py \&\& python modules/cardio\_kidney/train.py



\## Running the API



cd ai-services/chatbot

python predict\_api.py

\# Open http://localhost:8001/docs

