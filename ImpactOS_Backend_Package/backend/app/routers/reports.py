from io import BytesIO
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from app.schemas import ScenarioSave
router=APIRouter(prefix='/api/reports',tags=['Reports'])

@router.post('/pdf')
def report_pdf(body:ScenarioSave):
    if not body.result: raise HTTPException(422,'Provide the actual result JSON in the result field')
    result=body.result
    state=str(result.get('status',result.get('solver_result',{}).get('status','UNKNOWN')))
    buf=BytesIO(); pdf=canvas.Canvas(buf,pagesize=A4)
    w,h=A4; y=h-55
    def line(s):
        nonlocal y
        if y<65:
            pdf.showPage(); y=h-55
        pdf.drawString(45,y,str(s)[:105]); y-=20
    pdf.setTitle('ImpactOS Allocation Report')
    pdf.setFont('Helvetica-Bold',17); line('ImpactOS - Allocation Report')
    pdf.setFont('Helvetica',10)
    line('Scenario: '+body.name)
    line('Budget (INR): '+str(body.request.budget_inr))
    line('Solver status: '+state)
    if state in ('OPTIMAL','FEASIBLE'):
        line('Selected IDs: '+', '.join(map(str,result.get('selected_ids',result.get('solver_result',{}).get('selected_ids',[])))))
        line('Allocated (INR): '+str(result.get('total_cost_inr',result.get('solver_result',{}).get('total_cost_inr','N/A'))))
    else:
        line('No verified feasible allocation is reported.')
    line('Scoring weights: '+str(body.request.weights.model_dump()))
    line('Project proposals:')
    for p in body.request.projects:
        line(f'{p.project_id}: {p.project_name[:45]} | Cost INR {p.cost_inr} | {p.data_status}')
    line('NOTE: Recommendations only; not an official funding decision.')
    line('Source evidence must be independently verified before use.')
    pdf.save();buf.seek(0)
    return StreamingResponse(buf,media_type='application/pdf',headers={'Content-Disposition':'attachment; filename="ImpactOS_report.pdf"'})
