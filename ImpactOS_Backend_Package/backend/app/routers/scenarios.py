import json,uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.database import connect
from app.schemas import ScenarioSave
router=APIRouter(prefix='/api/scenarios',tags=['Scenarios'])

@router.get('')
def list_scenarios():
    with connect() as db:
        return [dict(id=r['id'],name=r['name'],created_at=r['created_at']) for r in db.execute('SELECT id,name,created_at FROM scenarios ORDER BY created_at DESC')]

@router.post('',status_code=201)
def save_scenario(scenario:ScenarioSave):
    uid=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    with connect() as db:
        db.execute('INSERT INTO scenarios VALUES (?,?,?,?)',(uid,scenario.name,scenario.model_dump_json(),now))
    return {'id':uid,'name':scenario.name,'created_at':now}

@router.get('/{scenario_id}')
def get_scenario(scenario_id:str):
    with connect() as db:
        row=db.execute('SELECT * FROM scenarios WHERE id=?',(scenario_id,)).fetchone()
    if not row: raise HTTPException(404,'Scenario not found')
    return {'id':row['id'],'created_at':row['created_at'],**json.loads(row['payload'])}

@router.delete('/{scenario_id}')
def delete_scenario(scenario_id:str):
    with connect() as db:
        cur=db.execute('DELETE FROM scenarios WHERE id=?',(scenario_id,))
        if cur.rowcount==0: raise HTTPException(404,'Scenario not found')
    return {'deleted':scenario_id}
