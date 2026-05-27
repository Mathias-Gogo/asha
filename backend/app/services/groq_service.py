import httpx
from app.config import GROQ_API_KEY, GROQ_API_URL
from app.utils.logger import logger


class GroqService:
    """
    Single responsibility: send prompts to Groq, return raw text.
    Never call this directly from routes — always go through an agent.
    """

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.api_url = GROQ_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _post(self, messages: list, max_tokens: int = 2048) -> str:
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.api_url, headers=self.headers, json=payload)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            logger.error(f"Groq HTTP error: {e.response.status_code} — {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Groq unexpected error: {e}")
            raise

    async def generate(self, prompt: str, system: str = "", max_tokens: int = 2048) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return await self._post(messages, max_tokens)

    async def chat(self, messages: list, system: str = "", max_tokens: int = 2048) -> str:
        full = []
        if system:
            full.append({"role": "system", "content": system})
        full.extend(messages)
        return await self._post(full, max_tokens)


# Singleton — import this instance everywhere
groq = GroqService()
