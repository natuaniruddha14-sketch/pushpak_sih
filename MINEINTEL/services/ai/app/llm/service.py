import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from app.llm.provider import LLMProviderFactory, LLMProviderBase, mask_sensitive_data

logger = logging.getLogger("mineintel.llm.service")


class StructuredCitation(BaseModel):
    document_id: str
    document_name: str
    page_number: int
    snippet: str
    relevance_score: float


class StructuredLLMResponse(BaseModel):
    answer: str
    confidence: float = 1.0
    citations: List[StructuredCitation] = Field(default_factory=list)
    calculations: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class LLMProvider:
    """
    Provider-agnostic LLM Service for MineIntel.
    Dynamically loads LLM provider from environment variables (LLM_PROVIDER, LLM_MODEL).
    Enforces strict grounding, calculation identification, citation retention,
    timeout/retry resilience, and secret masking in logs.
    """

    STRICT_GROUNDING_SYSTEM_PROMPT = (
        "You are MineIntel AI, the sovereign document intelligence system for CMPDI, CIL, and Ministry of Coal.\n"
        "STRICT SYSTEM BEHAVIOR RULES:\n"
        "1. Answer ONLY from supplied document evidence context.\n"
        "2. Never fabricate facts, figures, dates, or measurements.\n"
        "3. Never fabricate source names, document titles, page numbers, or IDs.\n"
        "4. Prefer structured tabular records for numerical questions (proved reserves, seam thickness, stripping ratio, ash content, GCV).\n"
        "5. Clearly identify calculations in the format: '[Calculation: <expression> = <result>]'.\n"
        "6. State when evidence is insufficient by outputting EXACTLY:\n"
        "   'Insufficient evidence found in the indexed documents.'\n"
        "7. Cite supporting documents with exact page numbers.\n"
        "8. Preserve uncertainty (e.g. state resource categories and confidence intervals explicitly)."
    )

    def __init__(
        self,
        provider: Optional[LLMProviderBase] = None,
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        self.provider = provider or LLMProviderFactory.get_provider(
            provider_name=provider_name,
            model_name=model_name,
            api_key=api_key
        )

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.2
    ) -> str:
        """
        Generate grounded text response from configured LLM provider.
        """
        sys_prompt = system_instruction or self.STRICT_GROUNDING_SYSTEM_PROMPT
        logger.info(f"[LLMProvider] Executing generate() via provider={self.provider.__class__.__name__}, model={self.provider.model_name}")

        try:
            res = await self.provider.generate_response(
                prompt=prompt,
                system_instruction=sys_prompt,
                max_tokens=max_tokens,
                temperature=temperature
            )
            return res
        except Exception as e:
            logger.error(f"[LLMProvider] Failure in generate(): {mask_sensitive_data(str(e))}")
            raise e

    async def generateStructured(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        max_tokens: int = 1000
    ) -> StructuredLLMResponse:
        """
        Generate grounded structured response containing answer, confidence, citations[],
        calculations[], and warnings[].
        """
        sys_prompt = system_instruction or self.STRICT_GROUNDING_SYSTEM_PROMPT
        logger.info(f"[LLMProvider] Executing generateStructured() via provider={self.provider.__class__.__name__}")

        raw_dict = await self.provider.generate_structured_json(
            prompt=prompt,
            schema=schema or {},
            system_instruction=sys_prompt,
            max_tokens=max_tokens
        )

        try:
            # Parse dict into StructuredLLMResponse
            citations_raw = raw_dict.get("citations", [])
            citations = [
                StructuredCitation(
                    document_id=c.get("document_id", "doc-unknown"),
                    document_name=c.get("document_name", "Document"),
                    page_number=c.get("page_number", 1),
                    snippet=c.get("snippet", ""),
                    relevance_score=c.get("relevance_score", 0.90)
                )
                for c in citations_raw if isinstance(c, dict)
            ]

            return StructuredLLMResponse(
                answer=raw_dict.get("answer", "Insufficient evidence found in the indexed documents."),
                confidence=float(raw_dict.get("confidence", 0.0)),
                citations=citations,
                calculations=raw_dict.get("calculations", []),
                warnings=raw_dict.get("warnings", [])
            )
        except Exception as e:
            logger.error(f"[LLMProvider] Parsing structured response failed: {mask_sensitive_data(str(e))}")
            return StructuredLLMResponse(
                answer="Insufficient evidence found in the indexed documents.",
                confidence=0.0,
                citations=[],
                calculations=[],
                warnings=[f"Failed to generate structured response: {mask_sensitive_data(str(e))}"]
            )
