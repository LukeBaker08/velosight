import json, re

def ensure_valid_json(text: str):
    # 1) strict
    try:
        return json.loads(text)
    except Exception:
        pass
    # 2) find largest {...}
    stack, start, best = 0, None, None
    for i, ch in enumerate(text):
        if ch == '{':
            if stack == 0: start = i
            stack += 1
        elif ch == '}':
            stack -= 1
            if stack == 0 and start is not None:
                best = text[start:i+1]
    if best:
        try:
            return json.loads(best)
        except Exception:
            pass
    # 3) simple trailing comma cleanup
    repaired = re.sub(r",\s*([}\]])", r"\1", text)
    m = re.search(r"\{.*\}", repaired, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    raise ValueError("Model did not return valid JSON.")
