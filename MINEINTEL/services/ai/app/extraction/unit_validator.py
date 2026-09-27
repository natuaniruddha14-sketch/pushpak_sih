import re
from typing import Optional, Tuple, Dict, Any


class UnitValidator:
    """Utility class for validating and normalizing mining units and numeric values."""

    # Standard Unit Mapping Dictionary
    UNIT_MAPPINGS: Dict[str, str] = {
        # Weight / Reserve
        "mt": "MT",
        "million tonnes": "MT",
        "million tons": "MT",
        "m.t.": "MT",
        "tonnes": "Tonnes",
        "tons": "Tonnes",
        "t": "Tonnes",
        # Stripping Ratio / Volume per Weight
        "m3/tonne": "m³/tonne",
        "m3/t": "m³/tonne",
        "m3/ton": "m³/tonne",
        "m³/tonne": "m³/tonne",
        "m³/t": "m³/tonne",
        "cu.m/tonne": "m³/tonne",
        # Volume
        "m3": "m³",
        "m³": "m³",
        "cu.m": "m³",
        "cubic meters": "m³",
        "million m3": "Million m³",
        "million m³": "Million m³",
        # Thickness / Depth / Distance
        "m": "m",
        "meter": "m",
        "meters": "m",
        "metres": "m",
        "metre": "m",
        # Energy / Calorific Value
        "kcal/kg": "kcal/kg",
        "kcal": "kcal/kg",
        "kcal/g": "kcal/kg",
        # Area
        "ha": "hectares",
        "hectare": "hectares",
        "hectares": "hectares",
        # Percentage
        "%": "%",
        "percent": "%",
        "pct": "%",
        # Water Flow
        "m3/day": "m³/day",
        "m3/hr": "m³/hr",
        "lps": "litres/sec",
        "litres/sec": "litres/sec",
    }

    @classmethod
    def normalize_unit(cls, raw_unit: str) -> str:
        """Normalize unit strings to canonical mining unit format."""
        if not raw_unit:
            return "units"
        cleaned = raw_unit.strip().lower()
        return cls.UNIT_MAPPINGS.get(cleaned, raw_unit.strip())

    @classmethod
    def validate_year(cls, year: Optional[int]) -> bool:
        """Validate whether a year is within a valid range (1950 - 2050)."""
        if year is None:
            return True
        return 1950 <= year <= 2050

    @classmethod
    def validate_numeric_value(cls, metric_name: str, value: float, unit: str) -> bool:
        """
        Validate numeric value bounds based on metric type and normalized unit.
        Ensures percentages are 0-100%, reserves/production non-negative, etc.
        """
        if value is None or not isinstance(value, (int, float)):
            return False

        # Percentages must be 0 - 100%
        if unit == "%" or "percent" in metric_name.lower() or "ash" in metric_name.lower():
            return 0.0 <= value <= 100.0

        # Production, Reserves, Thickness, Area must be non-negative
        if any(term in metric_name.lower() for term in ["production", "reserve", "thickness", "area", "stripping", "volume"]):
            return value >= 0.0

        # Gross Calorific Value (GCV) check (kcal/kg)
        if "gcv" in metric_name.lower() or unit == "kcal/kg":
            return 1000.0 <= value <= 9000.0

        return True

    @classmethod
    def parse_numeric(cls, val_str: str) -> Optional[float]:
        """Parse clean floating point number from string, removing commas."""
        if not val_str:
            return None
        cleaned = val_str.replace(",", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return None
