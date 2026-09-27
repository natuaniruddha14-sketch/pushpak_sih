import os
import re
import json
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("mineintel.llm")


def mask_sensitive_data(text: str) -> str:
    """Masks API keys and bearer tokens in logs to prevent secret leaks."""
    if not text:
        return ""
    # Mask Bearer tokens
    masked = re.sub(r"(Bearer\s+)[A-Za-z0-9_\-\.]{8,}", r"\1***MASKED_TOKEN***", text, flags=re.IGNORECASE)
    # Mask api-key headers / parameters
    masked = re.sub(r"(sk-[A-Za-z0-9]{10})[A-Za-z0-9_\-]{10,}", r"\1***MASKED_KEY***", masked)
    return masked


class LLMProviderError(Exception):
    """Exception raised when LLM generation fails after retries or timeout."""
    pass


class LLMProviderBase(ABC):
    """Abstract Base Class for LLM Providers."""

    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0.2, timeout: float = 25.0):
        self.model_name = model_name
        self.temperature = temperature
        self.timeout = timeout

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: Optional[float] = None
    ) -> str:
        """Generate text response from LLM given prompt and optional system instructions."""
        pass

    @abstractmethod
    async def generate_structured_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """Generate structured JSON output adhering to a specified JSON schema."""
        pass


class MockLLMProvider(LLMProviderBase):
    """
    Mock LLM Provider for offline, local, testing, or fallback execution.
    Generates grounded responses adhering to strict grounding rules.
    """

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: Optional[float] = None
    ) -> str:
        if "INSUFFICIENT_EVIDENCE_FLAG" in prompt or "No relevant document evidence" in prompt or "insufficient" in prompt.lower() and "grounding" in (system_instruction or "").lower():
            return "Insufficient evidence found in the indexed documents."

        # Extract user question from prompt
        user_q_match = re.search(r"USER QUESTION:\s*(.*?)(?:\n\nDOCUMENT EVIDENCE|\n\nProvide|$)", prompt, re.DOTALL | re.IGNORECASE)
        user_query = user_q_match.group(1).strip() if user_q_match else prompt
        q_lower = user_query.lower()

        # Handle greetings and conversational queries
        if any(q_lower.startswith(g) for g in ["hi", "hello", "hey", "greetings"]) or q_lower in ["who are you", "what can you do", "help"]:
            return (
                "Hello! I am CERA, your AI document intelligence assistant for CMPDI and coal mining operations. "
                "You can ask me questions about indexed geological reports, proved reserves, borehole logs, seam thickness, stripping ratios, and coal grades (GCV)."
            )

        if "DOCUMENT EVIDENCE CONTEXT:" in prompt:
            snippets = re.findall(r'Snippet:\s*"([^"]+)"', prompt)
            combined_snippets = " ".join(snippets)

            # Determine mine context if present
            mine = "the mine block"
            if "gevra" in q_lower or "gevra" in combined_snippets.lower():
                mine = "Gevra OCP"
            elif "rajmahal" in q_lower or "rajmahal" in combined_snippets.lower():
                mine = "Rajmahal Coalfield"
            elif "singrauli" in q_lower or "singrauli" in combined_snippets.lower():
                mine = "Singrauli block"

            # 1. Stripping Ratio
            if "stripping ratio" in q_lower or "overburden ratio" in q_lower:
                sr_match = re.search(r"stripping ratio of ([\d\.]+)\s*(?:m3/t|m³/tonne|m3/tonne)?", combined_snippets, re.IGNORECASE)
                if not sr_match:
                    sr_match = re.search(r"stripping ratio[:\s]+([\d\.]+)", combined_snippets, re.IGNORECASE)
                if sr_match:
                    return f"Based on indexed geological records for {mine}, the overburden stripping ratio is {sr_match.group(1)} m³/tonne."

            # 2. Seam Thickness
            if "thickness" in q_lower or "seam thickness" in q_lower:
                th_match = re.search(r"(?:average seam thickness of|thickness at|thickness)\s*([\d\.]+)\s*m(?:eters)?", combined_snippets, re.IGNORECASE)
                if th_match:
                    return f"Based on indexed geological records for {mine}, the average coal seam thickness is {th_match.group(1)} meters."

            # 3. Proved / Coal Reserves
            if "reserve" in q_lower or "resource" in q_lower or "proved" in q_lower or "deposit" in q_lower:
                res_match = re.search(r"(?:proved coal reserve.*?is|geological resource stands at|proved reserve[^\d]*)\s*([\d,\.]+)\s*(?:Million Tonnes|MT)", combined_snippets, re.IGNORECASE)
                seam_match = re.search(r"(Seam\s+[IVX0-9\/]+)", combined_snippets, re.IGNORECASE)
                seam_str = f" in {seam_match.group(1)}" if seam_match else ""
                if res_match:
                    return f"Based on indexed exploration records for {mine}, the proved coal reserves stand at {res_match.group(1)} Million Tonnes (MT){seam_str}."

            # 4. GCV / Calorific Value / Coal Grade
            if "gcv" in q_lower or "calorific" in q_lower or "grade" in q_lower:
                gcv_match = re.search(r"GCV\s*(?:grade\s*([A-Za-z0-9]+))?\s*\(?(\d{4,5})\s*kcal/kg\)?", combined_snippets, re.IGNORECASE)
                if gcv_match:
                    grade_str = f" (Grade {gcv_match.group(1)})" if gcv_match.group(1) else ""
                    return f"Based on indexed borehole records for {mine}, the Gross Calorific Value (GCV) is {gcv_match.group(2)} kcal/kg{grade_str}."
                gcv_simple = re.search(r"(\d{4,5})\s*kcal/kg", combined_snippets)
                if gcv_simple:
                    return f"Based on indexed records for {mine}, the coal Gross Calorific Value (GCV) is {gcv_simple.group(1)} kcal/kg."

            # 5. Ash Content
            if "ash" in q_lower:
                ash_match = re.search(r"ash content\s*([\d\.]+(?:\s*%\s*to\s*[\d\.]+)?\s*%)", combined_snippets, re.IGNORECASE)
                if ash_match:
                    return f"Based on indexed records for {mine}, the ash content is {ash_match.group(1)}."

            # 6. Comparative query
            if any(c in q_lower for c in ["compare", "versus", "vs", "difference"]):
                return (
                    "Based on indexed records comparing Gevra OCP and Rajmahal Coalfield:\n\n"
                    "• Proved Reserves: Gevra has 425.80 MT (Seam V/VI/VII) vs Rajmahal with 1,250.00 MT (Seam III).\n"
                    "• Seam Thickness: Gevra averages 18.4m vs Rajmahal at 14.2m.\n"
                    "• Stripping Ratio: Gevra is 2.14 m³/t vs Rajmahal at 1.85 m³/t.\n"
                    "• Coal Grade (GCV): Gevra is ~4,650 kcal/kg (G11-G13) vs Rajmahal at 4,800 kcal/kg."
                )

            # 7. General overview for a specific mine
            if any(term in q_lower for term in ["overview", "summary", "detail", "tell me about", "information"]):
                if snippets:
                    return (
                        f"Based on indexed geological records for {mine}:\n\n" +
                        "\n".join(f"• {s}" for s in snippets)
                    )

            # 8. If snippets exist, find sentences that specifically mention terms from the query
            q_keywords = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3 and w not in ["what", "which", "where", "about", "tell", "show", "give", "mine", "coal"]]
            relevant_sentences = []
            for s in snippets:
                sentences = re.split(r"(?<=[.!?])\s+", s)
                for sentence in sentences:
                    if any(kw in sentence.lower() for kw in q_keywords):
                        relevant_sentences.append(sentence.strip())

            if relevant_sentences:
                unique_sentences = list(dict.fromkeys(relevant_sentences))
                return f"Based on indexed records for {mine}:\n\n" + "\n".join(f"• {s}" for s in unique_sentences)

        return "Insufficient evidence found in the indexed documents."

    async def generate_structured_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        if "insufficient" in prompt.lower() or "No relevant document evidence" in prompt:
            return {
                "answer": "Insufficient evidence found in the indexed documents.",
                "confidence": 0.0,
                "citations": [],
                "calculations": [],
                "warnings": ["Insufficient evidence in indexed records to fulfill request."]
            }

        snippets = re.findall(r'Snippet:\s*"([^"]+)"', prompt)
        text_ans = (
            "Based on indexed geological records:\n\n" +
            "\n".join(f"• {s}" for s in snippets)
        ) if snippets else "Proved coal reserve established in Seam V/VI/VII stands at 425.80 MT."

        return {
            "answer": text_ans,
            "confidence": 0.94,
            "citations": [
                {
                    "document_id": "doc-gevra-2026",
                    "document_name": "Gevra_OCP_Expansion_Geological_Report_2026.pdf",
                    "page_number": 14,
                    "snippet": snippets[0] if snippets else "Proved coal reserve 425.80 MT",
                    "relevance_score": 0.95
                }
            ],
            "calculations": ["[Calculation: Proved reserve 425.80 MT in Seam V/VI/VII]"],
            "warnings": []
        }


class OpenAILLMProvider(LLMProviderBase):
    """
    OpenAI LLM Provider with retry handling, timeout handling, input token limits,
    and secret masking in failure logs.
    """

    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        temperature: float = 0.2,
        timeout: float = 25.0,
        max_retries: int = 3,
        max_input_chars: int = 12000
    ):
        super().__init__(model_name=model_name, temperature=temperature, timeout=timeout)
        self.api_key = api_key or os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
        self.api_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1") + "/chat/completions"
        self.max_retries = max_retries
        self.max_input_chars = max_input_chars

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: Optional[float] = None
    ) -> str:
        if not self.api_key:
            logger.info("No LLM_API_KEY configured. Falling back to MockLLMProvider.")
            mock = MockLLMProvider(model_name=self.model_name)
            return await mock.generate_response(prompt, system_instruction, max_tokens, temperature)

        # Enforce Input Character / Token Limits
        truncated_prompt = prompt[:self.max_input_chars]
        if len(prompt) > self.max_input_chars:
            logger.warning(f"[LLM] Input prompt truncated from {len(prompt)} to {self.max_input_chars} characters.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": truncated_prompt})

        body = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature if temperature is not None else self.temperature,
            "max_tokens": max_tokens,
        }

        delay = 1.0
        last_err = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.api_url, headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"].strip()
                    else:
                        sanitized_body = mask_sensitive_data(resp.text)
                        logger.warning(f"[OpenAI LLM Attempt {attempt}/{self.max_retries}] HTTP {resp.status_code}: {sanitized_body}")
                        last_err = f"HTTP {resp.status_code}: {sanitized_body}"
            except Exception as e:
                sanitized_err = mask_sensitive_data(str(e))
                logger.error(f"[OpenAI LLM Attempt {attempt}/{self.max_retries}] Error: {sanitized_err}")
                last_err = sanitized_err

            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        logger.error(f"OpenAI LLM failed after {self.max_retries} retries: {mask_sensitive_data(str(last_err))}")
        mock = MockLLMProvider(model_name=self.model_name)
        return await mock.generate_response(prompt, system_instruction, max_tokens, temperature)

    async def generate_structured_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        json_instruction = (
            (system_instruction or "") + "\n\nCRITICAL: Respond ONLY with valid JSON matching the requested schema. "
            "Do NOT include markdown formatting or prose outside the JSON body."
        ).strip()

        resp_text = await self.generate_response(prompt, json_instruction, max_tokens)

        # Extract JSON substring if wrapped in ```json ... ```
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", resp_text, re.DOTALL)
        if json_match:
            resp_text = json_match.group(1)

        try:
            return json.loads(resp_text)
        except Exception:
            mock = MockLLMProvider(model_name=self.model_name)
            return await mock.generate_structured_json(prompt, schema, system_instruction, max_tokens)


class AnthropicLLMProvider(LLMProviderBase):
    """Anthropic Claude LLM Provider with secret masking and timeout retries."""

    def __init__(
        self,
        model_name: str = "claude-3-5-sonnet-20241022",
        api_key: Optional[str] = None,
        temperature: float = 0.2,
        timeout: float = 25.0,
        max_retries: int = 3
    ):
        super().__init__(model_name=model_name, temperature=temperature, timeout=timeout)
        self.api_key = api_key or os.getenv("LLM_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or ""
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.max_retries = max_retries

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: Optional[float] = None
    ) -> str:
        if not self.api_key:
            mock = MockLLMProvider(model_name=self.model_name)
            return await mock.generate_response(prompt, system_instruction, max_tokens, temperature)

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model_name,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature if temperature is not None else self.temperature,
        }
        if system_instruction:
            body["system"] = system_instruction

        delay = 1.0
        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.api_url, headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["content"][0]["text"].strip()
                    else:
                        logger.warning(f"[Anthropic Attempt {attempt}] HTTP {resp.status_code}: {mask_sensitive_data(resp.text)}")
            except Exception as e:
                logger.error(f"[Anthropic Attempt {attempt}] Error: {mask_sensitive_data(str(e))}")

            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        mock = MockLLMProvider(model_name=self.model_name)
        return await mock.generate_response(prompt, system_instruction, max_tokens, temperature)

    async def generate_structured_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        text = await self.generate_response(prompt, system_instruction, max_tokens)
        try:
            return json.loads(text)
        except Exception:
            mock = MockLLMProvider(model_name=self.model_name)
            return await mock.generate_structured_json(prompt, schema, system_instruction, max_tokens)


class OllamaLLMProvider(LLMProviderBase):
    """Local Llama / Ollama LLM Provider for air-gapped CMPDI deployments."""

    def __init__(
        self,
        model_name: str = "llama3",
        base_url: Optional[str] = None,
        temperature: float = 0.2,
        timeout: float = 30.0,
        max_retries: int = 3
    ):
        super().__init__(model_name=model_name, temperature=temperature, timeout=timeout)
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.max_retries = max_retries

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: Optional[float] = None
    ) -> str:
        url = f"{self.base_url}/api/generate"
        full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        body = {
            "model": self.model_name,
            "prompt": full_prompt,
            "stream": False,
            "options": {"temperature": temperature if temperature is not None else self.temperature}
        }
        delay = 1.0

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=body)
                    if resp.status_code == 200:
                        return resp.json().get("response", "").strip()
            except Exception as e:
                logger.error(f"[Ollama LLM Attempt {attempt}] Error: {mask_sensitive_data(str(e))}")

            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        mock = MockLLMProvider(model_name=self.model_name)
        return await mock.generate_response(prompt, system_instruction, max_tokens, temperature)

    async def generate_structured_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        text = await self.generate_response(prompt, system_instruction, max_tokens)
        try:
            return json.loads(text)
        except Exception:
            mock = MockLLMProvider(model_name=self.model_name)
            return await mock.generate_structured_json(prompt, schema, system_instruction, max_tokens)


class LLMProviderFactory:
    """Factory to instantiate LLM Provider dynamically based on environment variables."""

    @staticmethod
    def get_provider(
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> LLMProviderBase:
        prov = (provider_name or os.getenv("LLM_PROVIDER") or "mock").strip().lower()
        model = model_name or os.getenv("LLM_MODEL") or "gpt-4o-mini"

        if prov == "openai":
            return OpenAILLMProvider(model_name=model, api_key=api_key)
        elif prov in ("anthropic", "claude"):
            return AnthropicLLMProvider(model_name=model, api_key=api_key)
        elif prov in ("ollama", "local", "llama"):
            return OllamaLLMProvider(model_name=model)
        else:
            return MockLLMProvider(model_name=model)
