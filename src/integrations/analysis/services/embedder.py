import os
from typing import List
from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-large")  # 3072 or 1536 dims depending on model

def embed(text: str) -> List[float]:
    # NOTE: ensure your DB vector column matches this dimension!
    resp = _client.embeddings.create(model=_EMBED_MODEL, input=text)
    return resp.data[0].embedding
