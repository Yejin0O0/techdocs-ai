import chromadb

COLLECTION_NAME = "documents"

client = chromadb.PersistentClient(path="./chroma_db")


def get_collection():
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
