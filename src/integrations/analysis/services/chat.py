import os
from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_CHAT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

def chat_complete(*, messages, response_format=None, temperature=0.1, max_tokens=1200) -> str:
    kwargs = {"model": _CHAT_MODEL, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if response_format: kwargs["response_format"] = response_format
    r = _client.chat.completions.create(**kwargs)
    return r.choices[0].message.content
