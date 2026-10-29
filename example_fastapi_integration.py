"""ImpactOS - FastAPI Integration Reference Example.

Exposes the Person 3 Optimization Engine via REST endpoints.
Demonstrates clean integration between FastAPI and optimizer.solver.solve_portfolio.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from optimizer.solver import InputValidationError, solve_portfolio

app = FastAPI(
    title="ImpactOS Optimization API",
    description="CP-SAT based budget allocation optimization engine for civic infrastructure projects.",
    version="1.0.0",
)

# Enable CORS for local frontend development (Person 1 dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Schemas for Swagger / OpenAPI Documentation
# ---------------------------------------------------------------------------
class ProjectSchema(BaseModel):
    id: str = Field(..., description="Unique, non-empty project identifier (e.g. 'ramps').", min_length=1)
    name: str = Field(..., description="Human-readable project title.", min_length=1)
    cost_inr: int = Field(..., description="Project cost in integer Indian Rupees (e.g. 220000).", ge=0)
    benefit_score: int = Field(..., description="Non-negative benefit / social impact score.", ge=0)
    is_accessibility: bool = Field(..., description="True if this project fulfills accessibility requirements.")
    depends_on: List[str] = Field(default_factory=list, description="List of prerequisite project IDs.")


class OptimizeRequest(BaseModel):
    budget_inr: int = Field(..., description="Total available budget in integer INR (e.g. 800000).", ge=0)
    require_accessibility: bool = Field(
        default=True,
        description="Whether at least one accessibility project must be selected.",
    )
    projects: List[ProjectSchema] = Field(..., description="List of candidate infrastructure projects.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "budget_inr": 800000,
                "require_accessibility": True,
                "projects": [
                    {
                        "id": "ramps",
                        "name": "Accessibility Ramps",
                        "cost_inr": 220000,
                        "benefit_score": 32,
                        "is_accessibility": True,
                        "depends_on": [],
                    },
                    {
                        "id": "substation",
                        "name": "Electrical Substation Upgrade",
                        "cost_inr": 150000,
                        "benefit_score": 18,
                        "is_accessibility": False,
                        "depends_on": [],
                    },
                    {
                        "id": "wifi",
                        "name": "Campus Wi-Fi Expansion",
                        "cost_inr": 170000,
                        "benefit_score": 25,
                        "is_accessibility": False,
                        "depends_on": ["substation"],
                    },
                ],
            }
        }
    }


class RejectedReasonSchema(BaseModel):
    id: str
    name: str
    reason: str


class OptimizeResponse(BaseModel):
    status: str = Field(..., description="Solver status: OPTIMAL, FEASIBLE, INFEASIBLE, MODEL_INVALID, or UNKNOWN.")
    selected_ids: List[str] = Field(..., description="List of IDs for all selected projects.")
    selected_projects: List[Dict[str, Any]] = Field(..., description="Full project objects for funded projects.")
    total_cost_inr: Optional[int] = Field(None, description="Sum of costs for selected projects in INR (null if infeasible).")
    total_benefit: Optional[int] = Field(None, description="Sum of benefit scores for selected projects (null if infeasible).")
    remaining_budget_inr: Optional[int] = Field(None, description="Unspent budget in INR (null if infeasible).")
    rejected_reasons: List[RejectedReasonSchema] = Field(..., description="Explanations for unselected projects.")
    message: str = Field(..., description="Detailed status message or infeasibility rationale.")


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", summary="Health Check")
def health_check() -> Dict[str, str]:
    """Return service health status and engine version."""
    return {
        "status": "healthy",
        "service": "ImpactOS Budget Allocation Optimization Engine",
        "engine": "Google OR-Tools CP-SAT",
        "version": "1.0.0",
    }


@app.post(
    "/api/optimize",
    response_model=OptimizeResponse,
    summary="Optimize Project Portfolio",
    description="Solves the budget-constrained portfolio optimization model using OR-Tools CP-SAT.",
)
def optimize_portfolio(request: OptimizeRequest) -> Dict[str, Any]:
    """Execute the optimization solver against candidate infrastructure projects.

    - Validates inputs (budget, costs, benefits, dependencies, cycles).
    - Maximizes total benefit subject to budget, accessibility, and dependency constraints.
    - Returns structured JSON allocation results.
    """
    payload = request.model_dump()
    try:
        result = solve_portfolio(payload)
        return result
    except InputValidationError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Input validation error: {str(err)}",
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal optimization error: {str(err)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("example_fastapi_integration:app", host="127.0.0.1", port=8000, reload=True)

