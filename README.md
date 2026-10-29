# ImpactOS — Smart Governance Through Optimization

**CYPHER ’26 | CivicTech, Public Transparency & Smart Governance**

ImpactOS is a decision-support platform designed to help public institutions and universities allocate limited budgets across competing projects. It uses constraint-based optimization to identify a high-value portfolio of projects while respecting budget limits, project dependencies, and accessibility policies.

The goal is to make public resource allocation more systematic, transparent, and explainable.

> **Development status:** ImpactOS is under development. The repository includes the initial project structure, draft data and API contracts, and a reporting module. The complete application is being developed and integrated.

---

## The Problem

Public institutions frequently receive more project requests than their available budgets can fund.

Decision-makers must determine which projects to prioritize while considering:

- Limited financial resources.
- Expected project benefits.
- Dependencies between projects.
- Accessibility and public-policy requirements.
- The need for transparent and auditable decisions.

Manual allocation can be difficult to reproduce, compare, and audit. Simple project rankings may also overlook dependencies and budget constraints.

ImpactOS aims to address these challenges through a structured, constraint-aware optimization workflow.

## Our Solution

ImpactOS is designed to help institutions evaluate competing project proposals and identify a suitable allocation under a defined set of constraints.

The proposed workflow is:

1. **Input:** Enter the available budget, project details, costs, benefit scores, dependencies, and policy requirements.
2. **Validation:** Validate the submitted data and reject malformed requests.
3. **Optimization:** Use Google OR-Tools CP-SAT to model project selection as a constrained optimization problem.
4. **Allocation:** Identify a portfolio that maximizes the total benefit score while satisfying the configured constraints.
5. **Visualization:** Display the allocation, budget utilization, and relevant validation results through the frontend.
6. **Reporting:** Generate an audit-oriented PDF containing the supplied inputs, allocation results, financial summaries, and validation checks.

The objective is not simply to rank projects, but to select a feasible combination of projects under the institution's constraints.

## Key Features

### Constraint-Based Budget Optimization
Identify project combinations that maximize the defined benefit objective without exceeding the available budget.

### Project Dependency Management
Represent prerequisite relationships between projects and prevent allocations that violate those dependencies.

### Accessibility Policy Enforcement
Support configurable accessibility requirements, such as requiring at least one qualifying accessibility project when the policy is enabled.

### Structured Input Validation
Validate project data, budget values, identifiers, and dependency references before optimization.

### Transparent Allocation Results
Present selected projects, total allocation, remaining budget, benefit scores, and solver status.

### Audit-Oriented PDF Reporting
Generate a report that summarizes the supplied optimization results and checks important calculations and configured constraints.

### Modular Architecture
Separate the frontend, backend, optimization engine, and reporting module to support independent development, testing, and integration.

---

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | User interface and results visualization |
| Backend | Python + FastAPI | Request validation and application coordination |
| Optimization | Google OR-Tools CP-SAT | Constraint-based project allocation |
| Reporting | Python + ReportLab | PDF audit report generation |
| Testing | Python `unittest` | Unit testing of reporting and contract-adapter functionality |
| Version Control | Git + GitHub | Source control and team collaboration |

*The stack describes the intended application architecture. Full integration of all components is in progress.*

## How the Optimization Works

ImpactOS models each project using a binary decision variable:

\[
x_i \in \{0,1\}
\]

where:

- \(x_i = 1\) means the project is selected.
- \(x_i = 0\) means the project is not selected.

### Objective Function

The model aims to maximize the total benefit score:

\[
\text{Maximize } Z = \sum_{i=1}^{n} b_i x_i
\]

where \(b_i\) represents the benefit score of project \(i\).

### Budget Constraint

The total cost of selected projects must not exceed the available budget:

\[
\sum_{i=1}^{n} c_i x_i \leq B
\]

where \(c_i\) is the cost of project \(i\) and \(B\) is the available budget.

### Dependency Constraint

If project \(j\) requires project \(i\), the model must enforce:

\[
x_j \leq x_i
\]

This ensures that a dependent project cannot be selected unless its prerequisite is also selected.

### Accessibility Constraint

When the configured policy requires at least one accessibility project:

\[
\sum_{i=1}^{n} a_i x_i \geq 1
\]

where \(a_i = 1\) if project \(i\) qualifies as an accessibility project and \(a_i = 0\) otherwise.

These constraints allow the optimizer to evaluate project combinations rather than relying solely on individual project rankings.

## Architecture

```text
                 User
                  |
                  v
        +--------------------+
        | React + Vite       |
        | Frontend           |
        +--------------------+
                  |
                  | API Request
                  v
        +--------------------+
        | FastAPI Backend    |
        | Validation         |
        +--------------------+
                  |
                  v
        +--------------------+
        | Optimization       |
        | Service            |
        +--------------------+
                  |
                  v
        +--------------------+
        | Google OR-Tools    |
        | CP-SAT Solver      |
        +--------------------+
                  |
                  v
        +--------------------+
        | Allocation Result  |
        +--------------------+
             |          |
             v          v
        Frontend     Reporting
                     Module
                         |
                         v
                      Audit PDF
```

The diagram represents the intended architecture. End-to-end integration is still in progress.

## Repository Structure

```text
ImpactOS/
├── .github/
│   └── workflows/
├── backend/
│   └── app/
│       ├── api/
│       │   └── routes/
│       ├── core/
│       ├── schemas/
│       └── services/
├── docs/
│   ├── api-contract.md
│   └── data-model.md
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── types/
│       └── utils/
├── optimizer/
├── reports/
│   ├── contract_adapter.py
│   ├── report_generator.py
│   ├── requirements.txt
│   └── templates/
├── scripts/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   └── unit/
├── .gitignore
└── README.md
```

Some directories are placeholders for components currently being developed.

## Reporting and Validation

The reporting module is designed to work with the agreed project-input and optimization-result schemas.

Its responsibilities include:

- Translating API fields into the reporting module's expected format.
- Recalculating allocation totals from the supplied project data.
- Checking the budget limit and configured project dependencies.
- Checking the configured accessibility requirement.
- Flagging inconsistencies between reported totals and recalculated values.
- Generating a structured PDF audit report.

The report helps reviewers inspect the supplied inputs and allocation results. It does not independently prove that a solver's optimality claim is correct; that depends on the actual optimization process and its result.

## Testing

The reporting module includes unit tests for functionality such as:

- Mapping API fields into the reporting schema.
- Rejecting invalid currency values.
- Rejecting unknown project dependencies.
- Generating a PDF using the draft API schema.
- Recalculating allocation totals.
- Detecting inconsistent budget or total values.
- Handling infeasible results without presenting them as a valid allocation.

**Current testing status:** Nine unit tests for the reporting module and contract adapter have passed in the development environment. Full end-to-end testing with the actual frontend, backend, and optimizer remains necessary.

## Current Limitations

ImpactOS is a prototype under development.

- The complete application workflow has not yet been verified end to end.
- The benefit-scoring method and final API schemas must remain consistent across components.
- Allocation quality depends on the accuracy and completeness of the supplied data.
- The demonstration dataset is illustrative and does not establish real-world impact.
- The audit report supports transparency and validation but does not replace institutional review or prove that a policy is legally satisfied.

## Team

**Team Name:** Motivational Supporters

**Event:** CYPHER ’26

**Theme:** CivicTech, Public Transparency & Smart Governance

**Team Members:**
- Madhav
- Mannan
- Pratik
- Moulik

## Vision

We envision a future in which public institutions can make resource-allocation decisions that are not only financially responsible, but also transparent, explainable, and easier to audit.

ImpactOS aims to bridge the gap between constrained public budgets and competing institutional needs through structured optimization and clear reporting.

---

**ImpactOS — Making Every Allocation More Accountable.**
