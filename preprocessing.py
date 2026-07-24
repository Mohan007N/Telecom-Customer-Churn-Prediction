"""
=============================================================
DEPRECATED: preprocessing.py (root-level monolithic script)
=============================================================
This file has been superseded by the modular pipeline in src/.

- src/data_cleaning.py     → Data loading and cleaning
- src/eda.py               → Exploratory data analysis
- src/feature_engineering.py → Feature engineering and preprocessing
- src/training.py          → XGBoost model training
- src/evaluation.py        → Model evaluation and metrics
- main.py                  → Pipeline orchestrator (run this instead)
- scripts/predict.py       → Inference pipeline
- scripts/serve.py         → FastAPI serving endpoint

DO NOT USE THIS FILE.
Run: python main.py
=============================================================
"""

raise DeprecationWarning(
    "\n\n[DEPRECATED] preprocessing.py is no longer used.\n"
    "Run the pipeline with: python main.py\n"
    "Run inference with:    python scripts/predict.py\n"
)
