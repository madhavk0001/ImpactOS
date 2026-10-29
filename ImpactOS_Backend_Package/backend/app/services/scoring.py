from app.schemas import Project, Weights

def calculate_scores(projects: list[Project], weights: Weights):
    # Reach is normalized to the largest beneficiary count in the submitted portfolio.
    # Scores are comparable only within the same project set and scoring configuration.
    max_beneficiaries=max((p.expected_beneficiaries for p in projects), default=0)
    output=[]
    for p in projects:
        components={
            'need':p.unmet_need_pct,
            'reach':round(100*p.expected_beneficiaries/max_beneficiaries,4) if max_beneficiaries else 0.0,
            'urgency':p.urgency_pct,
            'equity':p.vulnerable_beneficiary_pct,
            'readiness':p.readiness_pct,
        }
        contributions={key:round(value*getattr(weights,key),4) for key,value in components.items()}
        score=round(sum(contributions.values()),4)
        output.append({'project_id':p.project_id,'priority_score':score,'solver_benefit_score':round(score),
                       'components':components,'weighted_contributions':contributions,
                       'formula':'0.30*need + 0.25*reach + 0.20*urgency + 0.15*equity + 0.10*readiness (default weights; actual weights in response)',
                       'source':{'data_status':p.data_status,'evidence_indicator':p.evidence_indicator,'evidence_source_url':p.evidence_source_url,'evidence_year':p.evidence_year}})
    return output
