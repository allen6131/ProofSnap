from __future__ import annotations

import asyncio
from typing import Any

import httpx


class BaseHttpClient:
    def __init__(self, timeout: float = 15.0, retries: int = 3) -> None:
        self.timeout = timeout
        self.retries = retries

    async def get_json(
        self, url: str, headers: dict[str, str] | None = None, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        attempt = 0
        while True:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, headers=headers, params=params)
                    response.raise_for_status()
                    return response.json()
            except Exception:
                attempt += 1
                if attempt >= self.retries:
                    raise
                await asyncio.sleep(2**attempt)

    async def get_text(
        self, url: str, headers: dict[str, str] | None = None, params: dict[str, Any] | None = None
    ) -> str:
        attempt = 0
        while True:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, headers=headers, params=params)
                    response.raise_for_status()
                    return response.text
            except Exception:
                attempt += 1
                if attempt >= self.retries:
                    raise
                await asyncio.sleep(2**attempt)
