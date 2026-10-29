from fastapi import APIRouter
from app.schemas import OptimizationRequest, ScoreRequest
from app.services.demo import demo_request
from app.services.optimizer_bridge import run_optimization
from app.services.scoring import calculate_scores
router=APIRouter(prefix='/api',tags=['Core'])

@router.get('/health')
def health():
    return {'status':'ok','service':'ImpactOS API','version':'1.0.0'}

@router.get('/scenarios/demo',response_model=OptimizationRequest)
def demo():
    return demo_request()

@router.post('/scores/preview')
def preview(body:ScoreRequest):
    return {'weights':body.weights.model_dump(),'projects':calculate_scores(body.projects,body.weights),
            'note':'Scores are transparent demonstration policy scores; reach normalized within submitted project set.'}

@router.post('/optimize')
def optimize(body:OptimizationRequest):
    return run_optimization(body)
