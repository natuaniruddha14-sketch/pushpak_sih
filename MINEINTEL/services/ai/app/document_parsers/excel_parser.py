import pandas as pd
import openpyxl
from typing import Dict, Any, List


class ExcelDocumentParser:
    """Excel document parsing utility using pandas and openpyxl."""

    def extract_sheets(self, file_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """Extract data sheet by sheet as records using pandas and openpyxl."""
        wb = openpyxl.load_workbook(file_path, data_only=True)
        sheets_data = {}

        for sheet_name in wb.sheetnames:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            # Fill NaN values to ensure JSON serializable output
            df_filled = df.fillna("")
            sheets_data[sheet_name] = df_filled.to_dict(orient="records")

        wb.close()
        return sheets_data

# TODO: Detect CMPDI coal quality & reserve table header layouts
