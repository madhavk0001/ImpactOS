from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator

class Project(BaseModel):
    model_config = ConfigDict(extra='allow')
    project_id: str = Field(min_length=1)
    project_name: str = Field(min_length=1)
    sector: str = 'Other'
    location: str = 'Unspecified'
    cost_inr: int = Field(ge=0)
    expected_beneficiaries: int = Field(default=0, ge=0)
    unmet_need_pct: float = Field(default=50, ge=0, le=100)
    vulnerable_beneficiary_pct: float = Field(default=50, ge=0, le=100)
    readiness_pct: float = Field(default=50, ge=0, le=100)
    urgency_pct: float = Field(default=50, ge=0, le=100)
    depends_on: list[str] = Field(default_factory=list)
    is_accessibility: bool = False
    mandatory: bool = False
    benefit_score: int | None = Field(default=None, ge=0, le=100)
    evidence_indicator: str | None = None
    evidence_source_url: str | None = None
    evidence_year: int | None = None
    data_status: Literal['SYNTHETIC','REAL','ESTIMATED','MIXED'] = 'SYNTHETIC'

class Weights(BaseModel):
    need: float = Field(default=0.30, ge=0, le=1)
    reach: float = Field(default=0.25, ge=0, le=1)
    urgency: float = Field(default=0.20, ge=0, le=1)
    equity: float = Field(default=0.15, ge=0, le=1)
    readiness: float = Field(default=0.10, ge=0, le=1)
    @model_validator(mode='after')
    def check_total(self):
        if abs(sum([self.need,self.reach,self.urgency,self.equity,self.readiness])-1.0)>1e-6:
            raise ValueError('Weights must add up to 1.0')
        return self

class OptimizationRequest(BaseModel):
    budget_inr: int = Field(gt=0)
    projects: list[Project] = Field(min_length=1)
    require_accessibility: bool = False
    weights: Weights = Field(default_factory=Weights)
    scenario_name: str = 'Untitled scenario'
    @model_validator(mode='after')
    def check_projects(self):
        ids=[p.project_id for p in self.projects]
        if len(ids)!=len(set(ids)):
            raise ValueError('Duplicate project_id values')
        for p in self.projects:
            if p.project_id in p.depends_on:
                raise ValueError(f'{p.project_id} cannot depend on itself')
            for dep in p.depends_on:
                if dep not in ids:
                    raise ValueError(f'Unknown dependency {dep} for {p.project_id}')
        return self

class ScenarioSave(BaseModel):
    name: str = Field(min_length=1)
    request: OptimizationRequest
    result: dict[str, Any] | None = None

class ScoreRequest(BaseModel):
    projects: list[Project]
    weights: Weights = Field(default_factory=Weights)
