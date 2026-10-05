"""
clinical_thresholds.py - Standardized Diagnostic Thresholds for AURA

Defines evidence-based cutoffs for labeling unannotated clinical lab records
(e.g., NHANES cycles, raw EHR panels) across the 7 target conditions.

References:
- World Health Organization (WHO)
- American Thyroid Association (ATA)
- Centers for Disease Control and Prevention (CDC)
- Endocrine Society Clinical Practice Guidelines

# TODO: verify with clinician before publishing paper
"""

import pandas as pd
import numpy as np
from typing import Union, Tuple, Dict, Any

# ==============================================================================
# 1. VITAMIN B12 DEFICIENCY
# ==============================================================================
# SOURCE: WHO / CDC Laboratory Medicine Guidelines
# Serum vitamin B12 < 200 pg/mL (148 pmol/L) indicates deficiency with elevated
# risk for megaloblastic anemia and subacute combined degeneration.
# TODO: verify with clinician before publishing paper
B12_DEFICIENT_THRESHOLD_PG_ML: float = 200.0


def label_b12_deficiency(serum_b12: Union[float, pd.Series, np.ndarray]) -> Union[int, pd.Series, np.ndarray]:
    """
    Labels Vitamin B12 deficiency based on serum B12 in pg/mL.
    Returns 1 if < 200 pg/mL, else 0.
    """
    # TODO: verify with clinician before publishing paper
    if isinstance(serum_b12, pd.Series):
        return (serum_b12 < B12_DEFICIENT_THRESHOLD_PG_ML).astype(int)
    elif isinstance(serum_b12, np.ndarray):
        return (serum_b12 < B12_DEFICIENT_THRESHOLD_PG_ML).astype(int)
    return 1 if serum_b12 < B12_DEFICIENT_THRESHOLD_PG_ML else 0


# ==============================================================================
# 2. FOLATE DEFICIENCY
# ==============================================================================
# SOURCE: World Health Organization (WHO Guideline: Serum & RBC Folate Concentrations)
# Serum folate < 4.0 ng/mL (10 nmol/L) indicates acute negative folate balance.
# TODO: verify with clinician before publishing paper
FOLATE_DEFICIENT_THRESHOLD_NG_ML: float = 4.0


def label_folate_deficiency(serum_folate: Union[float, pd.Series, np.ndarray]) -> Union[int, pd.Series, np.ndarray]:
    """
    Labels Folate deficiency based on serum folate in ng/mL.
    Returns 1 if < 4.0 ng/mL, else 0.
    """
    # TODO: verify with clinician before publishing paper
    if isinstance(serum_folate, pd.Series):
        return (serum_folate < FOLATE_DEFICIENT_THRESHOLD_NG_ML).astype(int)
    elif isinstance(serum_folate, np.ndarray):
        return (serum_folate < FOLATE_DEFICIENT_THRESHOLD_NG_ML).astype(int)
    return 1 if serum_folate < FOLATE_DEFICIENT_THRESHOLD_NG_ML else 0


# ==============================================================================
# 3. VITAMIN D DEFICIENCY
# ==============================================================================
# SOURCE: Endocrine Society Clinical Practice Guidelines / Institute of Medicine (IOM)
# Serum 25-hydroxyvitamin D [25(OH)D] < 20 ng/mL (50 nmol/L) defines deficiency.
# Normal/Sufficient: 30 - 100 ng/mL; Insufficient: 20 - 29 ng/mL; Deficient: < 20 ng/mL.
# TODO: verify with clinician before publishing paper
VITAMIN_D_DEFICIENT_THRESHOLD_NG_ML: float = 20.0


def label_vitamin_d_deficiency(serum_25ohd: Union[float, pd.Series, np.ndarray]) -> Union[int, pd.Series, np.ndarray]:
    """
    Labels Vitamin D deficiency based on serum 25(OH)D in ng/mL.
    Returns 1 if < 20 ng/mL, else 0.
    """
    # TODO: verify with clinician before publishing paper
    if isinstance(serum_25ohd, pd.Series):
        return (serum_25ohd < VITAMIN_D_DEFICIENT_THRESHOLD_NG_ML).astype(int)
    elif isinstance(serum_25ohd, np.ndarray):
        return (serum_25ohd < VITAMIN_D_DEFICIENT_THRESHOLD_NG_ML).astype(int)
    return 1 if serum_25ohd < VITAMIN_D_DEFICIENT_THRESHOLD_NG_ML else 0


# ==============================================================================
# 4. IRON DEFICIENCY ANEMIA (IDA)
# ==============================================================================
# SOURCE: WHO Nutritional Anemias: Tools for Effective Prevention and Control
# Anemia: Hemoglobin < 12.0 g/dL in non-pregnant women; < 13.0 g/dL in men.
# Microcytosis characteristic of iron deficiency: MCV < 80.0 fL.
# TODO: verify with clinician before publishing paper
HB_THRESHOLD_FEMALE_G_DL: float = 12.0
HB_THRESHOLD_MALE_G_DL: float = 13.0
MCV_MICROCYTIC_THRESHOLD_FL: float = 80.0


def label_iron_deficiency_anemia(
    hemoglobin: Union[float, pd.Series, np.ndarray],
    mcv: Union[float, pd.Series, np.ndarray],
    gender: Union[int, pd.Series, np.ndarray]  # 0 or 2 = Female, 1 = Male
) -> Union[int, pd.Series, np.ndarray]:
    """
    Labels Iron Deficiency Anemia (IDA):
    Criteria:
      - Hb < 12 g/dL (Females) OR Hb < 13 g/dL (Males)
      AND
      - MCV < 80 fL (microcytosis)
    Returns 1 if true IDA criteria met, else 0.
    """
    # TODO: verify with clinician before publishing paper
    if isinstance(hemoglobin, pd.Series):
        # Gender encoding support: 1 = Male, 0 or 2 = Female
        is_male = (gender == 1)
        hb_cutoff = np.where(is_male, HB_THRESHOLD_MALE_G_DL, HB_THRESHOLD_FEMALE_G_DL)
        is_anemic = hemoglobin < hb_cutoff
        is_microcytic = mcv < MCV_MICROCYTIC_THRESHOLD_FL
        return (is_anemic & is_microcytic).astype(int)

    # Scalar branch
    is_male = (gender == 1)
    hb_cutoff = HB_THRESHOLD_MALE_G_DL if is_male else HB_THRESHOLD_FEMALE_G_DL
    return 1 if (hemoglobin < hb_cutoff and mcv < MCV_MICROCYTIC_THRESHOLD_FL) else 0


# ==============================================================================
# 5. THYROID DYSFUNCTIONS (HYPOTHYROID, HYPERTHYROID, SUBCLINICAL)
# ==============================================================================
# SOURCE: American Thyroid Association (ATA) / European Thyroid Association (ETA)
# - Hypothyroidism: TSH > 4.5 mIU/L AND FT4 < 0.8 ng/dL (overt primary hypothyroidism)
# - Hyperthyroidism: TSH < 0.4 mIU/L AND FT4 > 1.8 ng/dL (overt primary thyrotoxicosis)
# - Subclinical Hypothyroidism: TSH > 4.5 mIU/L AND FT4 Normal [0.8 - 1.8 ng/dL]
# TODO: verify with clinician before publishing paper
TSH_UPPER_NORMAL_MIU_L: float = 4.5
TSH_LOWER_NORMAL_MIU_L: float = 0.4
FT4_LOWER_NORMAL_NG_DL: float = 0.8
FT4_UPPER_NORMAL_NG_DL: float = 1.8

# Multiclass Label Mapping
THYROID_CLASS_NORMAL: int = 0
THYROID_CLASS_HYPOTHYROID: int = 1
THYROID_CLASS_HYPERTHYROID: int = 2
THYROID_CLASS_SUBCLINICAL: int = 3

THYROID_LABEL_NAMES: Dict[int, str] = {
    0: "Normal (Euthyroid)",
    1: "Hypothyroidism",
    2: "Hyperthyroidism",
    3: "Subclinical Thyroid Dysfunction"
}


def label_thyroid_condition(
    tsh: Union[float, pd.Series, np.ndarray],
    ft4: Union[float, pd.Series, np.ndarray]
) -> Union[int, pd.Series, np.ndarray]:
    """
    Categorizes thyroid functional status into 4 clinical groups:
    0 = Normal / Euthyroid
    1 = Hypothyroidism (TSH > 4.5 mIU/L AND FT4 < 0.8 ng/dL)
    2 = Hyperthyroidism (TSH < 0.4 mIU/L AND FT4 > 1.8 ng/dL)
    3 = Subclinical Hypothyroid (TSH > 4.5 mIU/L AND FT4 normal [0.8 - 1.8 ng/dL])
    """
    # TODO: verify with clinician before publishing paper
    if isinstance(tsh, pd.Series):
        conditions = [
            (tsh > TSH_UPPER_NORMAL_MIU_L) & (ft4 < FT4_LOWER_NORMAL_NG_DL),
            (tsh < TSH_LOWER_NORMAL_MIU_L) & (ft4 > FT4_UPPER_NORMAL_NG_DL),
            (tsh > TSH_UPPER_NORMAL_MIU_L) & (ft4 >= FT4_LOWER_NORMAL_NG_DL) & (ft4 <= FT4_UPPER_NORMAL_NG_DL)
        ]
        choices = [
            THYROID_CLASS_HYPOTHYROID,
            THYROID_CLASS_HYPERTHYROID,
            THYROID_CLASS_SUBCLINICAL
        ]
        return pd.Series(np.select(conditions, choices, default=THYROID_CLASS_NORMAL), index=tsh.index)

    # Scalar branch
    if tsh > TSH_UPPER_NORMAL_MIU_L and ft4 < FT4_LOWER_NORMAL_NG_DL:
        return THYROID_CLASS_HYPOTHYROID
    elif tsh < TSH_LOWER_NORMAL_MIU_L and ft4 > FT4_UPPER_NORMAL_NG_DL:
        return THYROID_CLASS_HYPERTHYROID
    elif tsh > TSH_UPPER_NORMAL_MIU_L and (FT4_LOWER_NORMAL_NG_DL <= ft4 <= FT4_UPPER_NORMAL_NG_DL):
        return THYROID_CLASS_SUBCLINICAL
    return THYROID_CLASS_NORMAL
