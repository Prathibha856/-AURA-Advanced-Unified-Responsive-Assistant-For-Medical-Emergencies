"""
models/llm_provider.py - Modular LLM Provider Interface and Ollama Implementation
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import requests
import config


class LLMProvider(ABC):
    """Abstract Base Class for LLM inference providers."""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """Generates completion text for the given prompt."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the LLM backend is responsive."""
        pass


class OllamaProvider(LLMProvider):
    """Ollama API Implementation supporting dynamic models."""

    def __init__(
        self,
        url: str = config.OLLAMA_URL,
        model: str = config.LLM_MODEL,
        timeout: int = config.LLM_TIMEOUT
    ):
        self.url = url
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:
        try:
            tags_url = self.url.replace("/api/generate", "/api/tags")
            res = requests.get(tags_url, timeout=3)
            return res.status_code == 200
        except Exception:
            return False

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        temp = temperature if temperature is not None else config.LLM_TEMPERATURE
        p = top_p if top_p is not None else config.LLM_TOP_P
        k = top_k if top_k is not None else config.LLM_TOP_K
        num_predict = max_tokens if max_tokens is not None else config.LLM_MAX_TOKENS

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temp,
                "top_p": p,
                "top_k": k,
                "num_predict": num_predict,
            }
        }

        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(self.url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()
        except requests.exceptions.Timeout:
            raise TimeoutError(f"LLM request timed out after {self.timeout}s.")
        except requests.exceptions.ConnectionError:
            raise ConnectionError(f"Could not connect to Ollama at {self.url}. Ensure Ollama is running.")
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {e}")


_provider_instance: Optional[LLMProvider] = None


def get_llm_provider() -> LLMProvider:
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = OllamaProvider()
    return _provider_instance
