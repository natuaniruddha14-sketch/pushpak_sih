from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass
class DocumentEntity:
    """Represents a domain entity extracted from a mining document page."""
    document_id: str
    page_number: int
    entity_type: str  # Project, Mine, Coal, Production, Overburden, Geological Resource, Groundwater, Land Reclamation, Environment, Location, Reporting Period, Year, Company, Organization, Units
    entity_value: str
    confidence: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "page_number": self.page_number,
            "entity_type": self.entity_type,
            "entity_value": self.entity_value,
            "confidence": round(self.confidence, 4),
            "metadata": self.metadata,
        }


@dataclass
class NumericalStructuredRecord:
    """Represents a structured numerical metric record extracted from a mining document page."""
    document_id: str
    source_page: int
    metric_name: str  # annual_production, proved_reserve, stripping_ratio, seam_thickness, ash_content, gcv, land_reclaimed, groundwater_inflow
    metric_value: float
    unit: str
    year: Optional[int] = None
    reporting_period: Optional[str] = None
    project: Optional[str] = None
    confidence: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "source_page": self.source_page,
            "metric_name": self.metric_name,
            "metric_value": self.metric_value,
            "unit": self.unit,
            "year": self.year,
            "reporting_period": self.reporting_period,
            "project": self.project,
            "confidence": round(self.confidence, 4),
            "metadata": self.metadata,
        }


@dataclass
class ExtractionResult:
    """Aggregated result for a document or set of pages."""
    document_id: str
    entities: List[DocumentEntity] = field(default_factory=list)
    structured_records: List[NumericalStructuredRecord] = field(default_factory=list)
    total_pages_processed: int = 0
    extraction_method: str = "DETERMINISTIC"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "entities": [e.to_dict() for e in self.entities],
            "structured_records": [r.to_dict() for r in self.structured_records],
            "total_pages_processed": self.total_pages_processed,
            "extraction_method": self.extraction_method,
        }
