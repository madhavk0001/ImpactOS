import os
os.environ['IMPACTOS_DB_PATH']=':memory:'  # replaced by tmp path in fixture
from fastapi.testclient import TestClient
from app.main import app
from app.services.demo import demo_request
from app.services.scoring import calculate_scores

def test_health(tmp_path):
    os.environ['IMPACTOS_DB_PATH']=str(tmp_path/'db.sqlite3')
    with TestClient(app) as c:
        r=c.get('/api/health')
        assert r.status_code==200
        assert c.get('/api/scenarios/demo').status_code==200

def test_score_preview():
    req=demo_request()
    scores=calculate_scores(req.projects,req.weights)
    assert len(scores)==6
    assert all(0<=s['priority_score']<=100 for s in scores)

def test_solver_missing(tmp_path, monkeypatch):
    os.environ['IMPACTOS_DB_PATH']=str(tmp_path/'db.sqlite3')
    with TestClient(app) as c:
        req=demo_request()
        r=c.post('/api/optimize',json=req.model_dump())
        assert r.status_code==503
        assert 'Optimizer unavailable' in r.json()['detail']

def test_project_crud(tmp_path):
    os.environ['IMPACTOS_DB_PATH']=str(tmp_path/'db.sqlite3')
    with TestClient(app) as c:
        p=demo_request().projects[0]
        assert c.post('/api/projects',json=p.model_dump()).status_code==201
        assert c.get('/api/projects').json()[0]['project_id']==p.project_id
        assert c.delete('/api/projects/'+p.project_id).status_code==200

def test_csv_and_report(tmp_path):
    from app.schemas import ScenarioSave
    os.environ['IMPACTOS_DB_PATH']=str(tmp_path/'db.sqlite3')
    with TestClient(app) as c:
        from pathlib import Path
        path=Path(__file__).resolve().parents[2]/'sample_data'/'demo_projects.csv'
        with path.open('rb') as fp:
            r=c.post('/api/projects/import/csv',files={'file':('demo.csv',fp,'text/csv')})
        assert r.status_code==200, r.text
        assert r.json()['imported_count']==6
        assert len(c.get('/api/projects').json())==6
        assert len(c.get('/api/projects/imports/history').json())==1
        demo=demo_request()
        report={'name':'Test report','request':demo.model_dump(), 'result':{'status':'INFEASIBLE'}}
        pdf=c.post('/api/reports/pdf',json=report)
        assert pdf.status_code==200 and pdf.content.startswith(b'%PDF')
