import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import initialize
from app.routers import core, projects, scenarios, reports

@asynccontextmanager
async def lifespan(app:FastAPI):
    initialize()
    yield

app=FastAPI(title='ImpactOS API',version='1.0.0',description='Evidence-driven public budget allocation API. Solver is an external integration.',lifespan=lifespan)
origins=[u.strip() for u in os.getenv('IMPACTOS_CORS_ORIGINS','http://localhost:5173,http://127.0.0.1:5173').split(',') if u.strip()]
app.add_middleware(CORSMiddleware,allow_origins=origins,allow_credentials=False,allow_methods=['*'],allow_headers=['*'])
for router in (core.router,projects.router,scenarios.router,reports.router):
    app.include_router(router)
