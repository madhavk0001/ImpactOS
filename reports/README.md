# ImpactOS Reporting Module

## Purpose

Generate a PDF audit report from project inputs and an optimization result.

## Files

- `report_generator.py`: Validates and renders the PDF report.
- `contract_adapter.py`: Converts the proposed ImpactOS API fields into
  the report generator's input format.
- `requirements.txt`: Reporting dependency declarations.

## Dependencies

Install the reporting dependency with:

```bash
python -m pip install -r reports/requirements.txt
