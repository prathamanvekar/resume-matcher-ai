# backend/ml/embeddings.py

from sentence_transformers import SentenceTransformer
import numpy as np
from config import settings

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        """Load sentence transformer model"""
        print(f"🔄 Loading embedding model: {settings.EMBEDDING_MODEL}")
        self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(f"✅ Embedding model loaded (dim={self._model.get_sentence_embedding_dimension()})")

    def encode(self, texts, normalize=True):
        """Encode texts to embeddings"""
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self._model.encode(texts, show_progress_bar=False)

        if normalize:
            # Normalize for cosine similarity
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / norms

        return embeddings.astype('float32')

    def get_dimension(self):
        return self._model.get_sentence_embedding_dimension()


# Global instance
embedding_service = EmbeddingService()
