# backend/ml/model_loader.py

import pickle
import json
import numpy as np
from pathlib import Path
from config import settings
import os

class ModelLoader:
    _instance = None
    _models = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_all_models()
        return cls._instance

    def _load_all_models(self):
        """Load all trained models on startup"""
        models_path = Path(settings.MODELS_PATH)

        print(f"📂 Loading models from: {models_path}")

        # Load pickle files
        pkl_files = [
            'tfidf_vectorizer.pkl',
            'category_classifier.pkl',
            'ats_scorer.pkl',
            'job_metadata.pkl',
            'outcome_predictor.pkl',
            'transition_model.pkl'
        ]

        for filename in pkl_files:
            filepath = models_path / filename
            if filepath.exists():
                with open(filepath, 'rb') as f:
                    key = filename.replace('.pkl', '')
                    self._models[key] = pickle.load(f)
                    print(f"  ✅ Loaded {filename}")
            else:
                print(f"  ⚠️ Not found: {filename}")

        # Load JSON files
        json_files = [
            'ats_config.json',
            'skill_taxonomy.json',
            'categories.json',
            'skill_job_mapping.json',
            'role_transition_graph.json',
            'outcome_config.json'
        ]

        for filename in json_files:
            filepath = models_path / filename
            if filepath.exists():
                with open(filepath, 'r') as f:
                    key = filename.replace('.json', '')
                    self._models[key] = json.load(f)
                    print(f"  ✅ Loaded {filename}")
            else:
                print(f"  ⚠️ Not found: {filename}")

        # Load numpy files
        npy_files = ['job_embeddings.npy']
        for filename in npy_files:
            filepath = models_path / filename
            if filepath.exists():
                key = filename.replace('.npy', '')
                self._models[key] = np.load(filepath)
                print(f"  ✅ Loaded {filename}")
            else:
                print(f"  ⚠️ Not found: {filename}")

        print(f"📦 Loaded {len(self._models)} models/configs")

    def get(self, key):
        """Get a loaded model by key"""
        return self._models.get(key)

    def get_tfidf(self):
        return self._models.get('tfidf_vectorizer')

    def get_category_classifier(self):
        return self._models.get('category_classifier')

    def get_ats_scorer(self):
        return self._models.get('ats_scorer')

    def get_ats_config(self):
        return self._models.get('ats_config')

    def get_skill_taxonomy(self):
        return self._models.get('skill_taxonomy')

    def get_categories(self):
        return self._models.get('categories')

    def get_job_metadata(self):
        return self._models.get('job_metadata')

    def get_job_embeddings(self):
        return self._models.get('job_embeddings')

    def get_outcome_predictor(self):
        return self._models.get('outcome_predictor')

    def get_outcome_config(self):
        return self._models.get('outcome_config')

    def get_transition_model(self):
        return self._models.get('transition_model')

    def get_transition_graph(self):
        return self._models.get('role_transition_graph')

    def get_skill_job_mapping(self):
        return self._models.get('skill_job_mapping')


# Global instance
model_loader = ModelLoader()
