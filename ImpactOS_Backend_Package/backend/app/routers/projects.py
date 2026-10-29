import json, uuid, csv, io
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.database import connect
from app.schemas import Project
router=APIRouter(prefix='/api/projects',tags=['Projects'])

@router.get('')
def list_projects():
    with connect() as db:
        return [json.loads(r['payload']) for r in db.execute('SELECT payload FROM projects ORDER BY project_id')]

@router.get('/imports/history')
def imports_history():
    with connect() as db:
        return [dict(r) for r in db.execute('SELECT * FROM imports ORDER BY created_at DESC')]

@router.get('/{project_id}')
def get_project(project_id:str):
    with connect() as db:
        row=db.execute('SELECT payload FROM projects WHERE project_id=?',(project_id,)).fetchone()
    if not row: raise HTTPException(404,'Project not found')
    return json.loads(row['payload'])

@router.post('',status_code=201)
def create_project(project:Project):
    with connect() as db:
        if db.execute('SELECT 1 FROM projects WHERE project_id=?',(project.project_id,)).fetchone():
            raise HTTPException(409,'Project ID already exists')
        db.execute('INSERT INTO projects VALUES (?,?)',(project.project_id,project.model_dump_json()))
    return project

@router.put('/{project_id}')
def update_project(project_id:str, project:Project):
    if project.project_id!=project_id: raise HTTPException(400,'Project ID cannot be changed')
    with connect() as db:
        cur=db.execute('UPDATE projects SET payload=? WHERE project_id=?',(project.model_dump_json(),project_id))
        if cur.rowcount==0: raise HTTPException(404,'Project not found')
    return project

@router.delete('/{project_id}')
def delete_project(project_id:str):
    with connect() as db:
        cur=db.execute('DELETE FROM projects WHERE project_id=?',(project_id,))
        if cur.rowcount==0: raise HTTPException(404,'Project not found')
    return {'deleted':project_id}

@router.post('/import/csv')
async def import_csv(file:UploadFile=File(...)):
    if not (file.filename or '').lower().endswith('.csv'): raise HTTPException(400,'Upload a CSV file')
    raw=await file.read(5_000_001)
    if len(raw)>5_000_000: raise HTTPException(413,'Maximum file size is 5 MB')
    try:
        rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
        if len(rows)>5000: raise ValueError('Maximum 5000 rows')
        projects=[]
        for row in rows:
            mapped=dict(row)
            if 'cost_inr' not in mapped and mapped.get('cost_lakh'):
                mapped['cost_inr']=round(float(mapped['cost_lakh'])*100000)
            if mapped.get('depends_on_project') and not mapped.get('depends_on'):
                mapped['depends_on']=[mapped['depends_on_project']]
            elif isinstance(mapped.get('depends_on'),str):
                mapped['depends_on']=[v.strip() for v in mapped['depends_on'].split(';') if v.strip()]
            if not mapped.get('data_status'): mapped['data_status']='SYNTHETIC'
            if mapped.get('evidence_year')=='':mapped['evidence_year']=None
            if mapped.get('benefit_score')=='':mapped['benefit_score']=None
            projects.append(Project.model_validate(mapped))
        ids=[p.project_id for p in projects]
        if len(ids)!=len(set(ids)): raise ValueError('Duplicate IDs in CSV')
    except Exception as exc:
        raise HTTPException(422,f'CSV validation error: {exc}') from exc
    import_id=str(uuid.uuid4())
    with connect() as db:
        for project in projects:
            db.execute('INSERT INTO projects(project_id,payload) VALUES (?,?) ON CONFLICT(project_id) DO UPDATE SET payload=excluded.payload',
                       (project.project_id,project.model_dump_json()))
        db.execute('INSERT INTO imports VALUES (?,?,?,?)',(import_id,file.filename,len(projects),datetime.now(timezone.utc).isoformat()))
    return {'import_id':import_id,'filename':file.filename,'imported_count':len(projects), 'mode':'upsert', 'warning':'CSV records are project proposals, not automatically verified government evidence.'}

