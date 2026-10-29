import importlib
from fastapi import HTTPException
from app.schemas import OptimizationRequest
from app.services.scoring import calculate_scores

def run_optimization(request: OptimizationRequest):
    """Only adapts/validates the interface; no solver is implemented here."""
    score_rows=calculate_scores(request.projects, request.weights)
    by_id={s['project_id']:s for s in score_rows}
    solver_projects=[]
    for p in request.projects:
        obj=p.model_dump(exclude_none=True)
        obj['benefit_score']=by_id[p.project_id]['solver_benefit_score']
        solver_projects.append(obj)
    payload={'budget_inr':request.budget_inr,'projects':solver_projects,
             'require_accessibility':request.require_accessibility}
    try:
        module=importlib.import_module('optimizer.solver')
        solver=module.solve_portfolio
    except (ImportError, AttributeError) as exc:
        raise HTTPException(status_code=503,detail='Optimizer unavailable: add root optimizer/solver.py with solve_portfolio(payload).') from exc
    try:
        result=solver(payload)
    except Exception as exc:
        raise HTTPException(status_code=502,detail=f'Optimizer execution failed: {type(exc).__name__}: {exc}') from exc
    if not isinstance(result,dict):
        raise HTTPException(status_code=502,detail='Optimizer returned a non-object response')
    status=str(result.get('status','')).upper()
    if status not in ('OPTIMAL','FEASIBLE','INFEASIBLE','UNKNOWN'):
        raise HTTPException(status_code=502,detail='Optimizer must return status OPTIMAL, FEASIBLE, INFEASIBLE, or UNKNOWN')
    if status in ('OPTIMAL','FEASIBLE'):
        selected_ids=result.get('selected_ids')
        if not isinstance(selected_ids,list):
            raise HTTPException(status_code=502,detail='Optimizer must return selected_ids list')
        if len(selected_ids)!=len(set(selected_ids)) or any(pid not in by_id for pid in selected_ids):
            raise HTTPException(status_code=502,detail='Optimizer returned invalid selected IDs')
        chosen=[p for p in request.projects if p.project_id in selected_ids]
        spent=sum(p.cost_inr for p in chosen)
        if spent>request.budget_inr:
            raise HTTPException(status_code=502,detail='Optimizer returned an over-budget selection')
        selected_set=set(selected_ids)
        if any(not set(p.depends_on).issubset(selected_set) for p in chosen):
            raise HTTPException(status_code=502,detail='Optimizer violated project dependencies')
        if any(p.mandatory and p.project_id not in selected_set for p in request.projects):
            raise HTTPException(status_code=502,detail='Optimizer omitted a mandatory project')
        if request.require_accessibility and not any(p.is_accessibility for p in chosen):
            raise HTTPException(status_code=502,detail='Optimizer omitted required accessibility project')
        result['total_cost_inr']=spent
        result['remaining_budget_inr']=request.budget_inr-spent
        result['total_benefit']=sum(by_id[p.project_id]['solver_benefit_score'] for p in chosen)
    else:
        result.pop('selected_ids',None)
        result.pop('total_cost_inr',None)
        result.pop('remaining_budget_inr',None)
        result.pop('total_benefit',None)
    return {'scenario_name':request.scenario_name,'budget_inr':request.budget_inr,
            'weights':request.weights.model_dump(), 'score_breakdown':score_rows,
            'solver_result':result, **result,
            'data_notice':'Project proposals are synthetic unless individually marked otherwise. Results are recommendations, not funding approvals.'}
