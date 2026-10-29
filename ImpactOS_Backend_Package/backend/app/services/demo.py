import csv
from pathlib import Path
from app.schemas import Project, OptimizationRequest

def demo_request():
    path=Path(__file__).resolve().parents[3]/'sample_data'/'demo_projects.csv'
    projects=[]
    with path.open(newline='',encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            projects.append(Project(
                project_id=row['project_id'],project_name=row['project_name'],sector=row['sector'],
                location=row['location'],cost_inr=round(float(row['cost_lakh'])*100000),
                expected_beneficiaries=int(row['expected_beneficiaries']),
                unmet_need_pct=float(row['unmet_need_pct']),
                vulnerable_beneficiary_pct=float(row['vulnerable_beneficiary_pct']),
                readiness_pct=float(row['readiness_pct']),
                depends_on=[row['depends_on_project']] if row.get('depends_on_project') else [],
                evidence_indicator=row.get('evidence_indicator') or None,
                evidence_source_url=row.get('evidence_source_url') or None,
                evidence_year=int(row['evidence_year']) if row.get('evidence_year') else None,
                data_status='SYNTHETIC'))
    return OptimizationRequest(budget_inr=10000000,projects=projects,scenario_name='Synthetic district demo')
