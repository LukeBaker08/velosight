from typing import Dict, List

DEFAULT_WEIGHTS = {"project":1.0, "context":0.9, "sentiment":0.6, "framework":0.85}

def compact_snippets(
    batches: Dict[str, List[dict]],
    weights: Dict[str, float] = DEFAULT_WEIGHTS,
    min_score: float = 0.2,
    max_chars: int = 9000
) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = {}
    for key, rows in batches.items():
        w = weights.get(key, 1.0)
        ranked = sorted(rows, key=lambda r: r["score"], reverse=True)
        acc, used = [], 0
        # Give framework a slightly larger share
        budget = max_chars//3 if key == "framework" else max_chars//4
        for i, r in enumerate(ranked, 1):
            s = r["score"] * w
            if s < min_score:
                continue
            meta = r.get("metadata") or {}
            title = meta.get("title") or meta.get("name") or ""
            head = f"({i}) score={s:.2f} source_id={key}:{r['id']} title=\"{title}\"\n"
            snippet = (r["content"] or "")[:1500]
            chunk = head + snippet
            if used + len(chunk) > budget:
                break
            acc.append(chunk); used += len(chunk)
        out[key] = acc
    return out
