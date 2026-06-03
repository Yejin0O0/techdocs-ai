from typing import Literal

DocStatus = Literal["uploading", "indexing", "ready", "error"]

docs_store: dict[str, dict] = {}
status_events: list[dict] = []
