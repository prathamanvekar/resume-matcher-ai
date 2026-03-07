# backend/ml/faiss_search.py

import faiss
import numpy as np
from pathlib import Path
from config import settings
from .model_loader import model_loader
from .embeddings import embedding_service

class FAISSSearch:
    _instance = None
    _index = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_index()
        return cls._instance

    def _load_index(self):
        """Load FAISS index"""
        index_path = Path(settings.MODELS_PATH) / 'job_index.faiss'

        if index_path.exists():
            print(f"🔄 Loading FAISS index from: {index_path}")
            self._index = faiss.read_index(str(index_path))
            print(f"✅ FAISS index loaded ({self._index.ntotal} vectors)")
        else:
            print(f"⚠️ FAISS index not found at {index_path}")
            self._index = None

    def search(self, query_text, k=10):
        """Search for similar jobs"""
        if self._index is None:
            return []

        # Encode query
        query_embedding = embedding_service.encode(query_text)

        # Search
        distances, indices = self._index.search(query_embedding, k)

        # Get job metadata
        job_metadata = model_loader.get_job_metadata()

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(job_metadata):
                job = job_metadata[idx].copy()
                job['similarity_score'] = float(dist)
                results.append(job)

        return results

    def search_by_embedding(self, embedding, k=10):
        """Search using pre-computed embedding"""
        if self._index is None:
            return []

        # Ensure correct shape
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)

        # Normalize
        faiss.normalize_L2(embedding)

        # Search
        distances, indices = self._index.search(embedding.astype('float32'), k)

        # Get job metadata
        job_metadata = model_loader.get_job_metadata()

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(job_metadata):
                job = job_metadata[idx].copy()
                job['similarity_score'] = float(dist)
                results.append(job)

        return results


# Global instance
faiss_search = FAISSSearch()
