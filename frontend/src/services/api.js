/**
 * ==============================================================================
 * IMPACTOS PROVISIONAL API ADAPTER
 *
 * All transport details, endpoint definitions, payload mappings, and error
 * normalizations are isolated in this module.
 *
 * PROVISIONAL ENDPOINT SPECIFICATION (Subject to backend teammate confirmation):
 * - GET  /health           : Health check probe
 * - GET  /scenarios/demo   : Fetch default backend candidate scenario
 * - POST /optimize         : Run mathematical optimization solver
 * - GET  /runs             : Retrieve historical real optimization runs
 * - GET  /runs/{id}        : Retrieve single run by run_id
 * - GET  /runs/{id}/report : Retrieve downloadable audit report payload
 *
 * CONTRACT RULES:
 * 1. Failed requests NEVER fall back to mock results.
 * 2. Unrecognized solver statuses are flagged explicitly.
 * 3. Components receive normalized UI models, not raw transport shapes.
 * ==============================================================================
 */

// Default configuration
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let currentApiBaseUrl = DEFAULT_API_BASE_URL;

export function setApiBaseUrl(newUrl) {
  if (newUrl && typeof newUrl === 'string') {
    currentApiBaseUrl = newUrl.replace(/\/+$/, '');
  }
}

export function getApiBaseUrl() {
  return currentApiBaseUrl;
}

export class APIError extends Error {
  /**
   * @param {string} message
   * @param {'NETWORK_ERROR'|'CORS_ERROR'|'HTTP_ERROR'|'PARSE_ERROR'|'SCHEMA_ERROR'|'UNKNOWN'} code
   * @param {number|null} status
   * @param {any} details
   */
  constructor(message, code = 'UNKNOWN', status = null, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Standard fetch wrapper with normalized error handling
 */
async function fetchWithTimeout(endpoint, options = {}, timeoutMs = 12000) {
  const url = `${currentApiBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const mergedOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(id);

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      throw new APIError(
        errorBody?.message || errorBody?.detail || `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR',
        response.status,
        errorBody
      );
    }

    // Try parsing JSON
    try {
      return await response.json();
    } catch (parseErr) {
      throw new APIError('Response could not be parsed as JSON', 'PARSE_ERROR', response.status, parseErr);
    }
  } catch (err) {
    clearTimeout(id);

    if (err instanceof APIError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new APIError(`Request timed out after ${timeoutMs / 1000}s. Check if server is running at ${currentApiBaseUrl}.`, 'NETWORK_ERROR');
    }

    // Check for probable CORS or connection refused
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new APIError(
        `Unable to reach backend at ${currentApiBaseUrl}. Ensure the Python FastAPI server is running and CORS is configured.`,
        'NETWORK_ERROR'
      );
    }

    throw new APIError(err.message || 'An unexpected transport error occurred', 'UNKNOWN', null, err);
  }
}

/**
 * Validate and normalize solver status string
 */
export function normalizeSolverStatus(rawStatus) {
  if (!rawStatus) return 'UNKNOWN';
  const upper = String(rawStatus).toUpperCase().trim();
  const KNOWN_STATUSES = ['OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'ERROR', 'ILLUSTRATIVE'];
  if (KNOWN_STATUSES.includes(upper)) {
    return upper;
  }
  return `UNRECOGNIZED (${rawStatus})`;
}

/**
 * Check backend health
 * GET /health
 */
export async function checkHealth() {
  try {
    const data = await fetchWithTimeout('/health', { method: 'GET' }, 4000);
    return {
      connected: true,
      status: data?.status || 'ok',
      version: data?.version || '1.0.0',
      message: data?.message || 'Backend is reachable',
    };
  } catch (error) {
    return {
      connected: false,
      status: 'disconnected',
      error: error.message,
      code: error.code,
    };
  }
}

/**
 * Fetch default scenario from backend
 * GET /scenarios/demo
 */
export async function fetchDemoScenario() {
  const data = await fetchWithTimeout('/scenarios/demo', { method: 'GET' });
  if (!data || !Array.isArray(data.projects)) {
    throw new APIError('Invalid scenario response format from backend', 'SCHEMA_ERROR', 200, data);
  }

  return {
    scenario_id: data.scenario_id || 'remote-demo',
    title: data.title || 'Backend Academic Portfolio',
    budget_inr: Number(data.budget_inr) || 50_000_000,
    projects: data.projects.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      department: String(p.department || 'General'),
      cost_inr: Number(p.cost_inr),
      benefit_score: Number(p.benefit_score),
      accessible: Boolean(p.accessible),
      dependencies: Array.isArray(p.dependencies) ? p.dependencies.map(String) : [],
      isPlaceholder: false,
    })),
  };
}

/**
 * Submit optimization request to Google OR-Tools backend
 * POST /optimize
 *
 * Provisional Request:
 * {
 *   budget_inr: integer,
 *   projects: [{ id, name, department, cost_inr, benefit_score, accessible, dependencies }]
 * }
 */
export async function submitOptimization(budgetInr, projects) {
  if (!budgetInr || budgetInr <= 0) {
    throw new APIError('Budget must be a positive integer in INR', 'SCHEMA_ERROR');
  }
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new APIError('At least one project must be provided for optimization', 'SCHEMA_ERROR');
  }

  // Construct provisional payload
  const payload = {
    budget_inr: Math.round(Number(budgetInr)),
    projects: projects.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      department: String(p.department),
      cost_inr: Math.round(Number(p.cost_inr)),
      benefit_score: Number(p.benefit_score),
      accessible: Boolean(p.accessible),
      dependencies: Array.isArray(p.dependencies) ? p.dependencies : [],
    })),
  };

  const response = await fetchWithTimeout('/optimize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // Validate response contract
  if (!response.run_id || !response.status) {
    throw new APIError(
      'Malformed optimization response: Missing run_id or status from solver',
      'SCHEMA_ERROR',
      200,
      response
    );
  }

  const normalizedStatus = normalizeSolverStatus(response.status);

  // Normalize into standard UI model
  const fundedIds = Array.isArray(response.funded_ids) ? response.funded_ids.map(String) : [];
  const allIds = projects.map((p) => String(p.id));
  const unfundedIds = allIds.filter((id) => !fundedIds.includes(id));

  return {
    run_id: String(response.run_id),
    status: normalizedStatus,
    raw_status: response.status,
    timestamp: response.timestamp || new Date().toISOString(),
    is_illustrative: false,
    total_budget_inr: Math.round(Number(budgetInr)),
    total_cost_inr: Number(response.total_cost_inr || 0),
    remaining_budget_inr: Number(response.remaining_budget_inr || (budgetInr - (response.total_cost_inr || 0))),
    total_benefit: Number(response.total_benefit || 0),
    funded_ids: fundedIds,
    unfunded_ids: unfundedIds,
    solver_message: response.solver_message || `Solver concluded with status: ${normalizedStatus}`,
    constraints_summary: response.constraints_summary || null,
    department_breakdown: response.department_breakdown || null,
    // Keep snapshot of exact inputs passed to solver
    input_snapshot: {
      budget_inr: Math.round(Number(budgetInr)),
      project_ids: projects.map((p) => p.id),
      projects_hash: JSON.stringify(payload),
    },
  };
}

/**
 * Retrieve real optimization runs
 * GET /runs
 */
export async function fetchRuns() {
  const data = await fetchWithTimeout('/runs', { method: 'GET' });
  if (!Array.isArray(data)) {
    throw new APIError('Expected array of runs from GET /runs', 'SCHEMA_ERROR', 200, data);
  }
  return data.map((run) => ({
    run_id: String(run.run_id),
    status: normalizeSolverStatus(run.status),
    timestamp: run.timestamp || new Date().toISOString(),
    total_budget_inr: Number(run.total_budget_inr),
    total_cost_inr: Number(run.total_cost_inr),
    total_benefit: Number(run.total_benefit),
    funded_count: Array.isArray(run.funded_ids) ? run.funded_ids.length : Number(run.funded_count || 0),
    is_illustrative: false,
  }));
}

/**
 * Retrieve single run details
 * GET /runs/{id}
 */
export async function fetchRunById(runId) {
  if (!runId) throw new APIError('Run ID is required', 'SCHEMA_ERROR');
  const data = await fetchWithTimeout(`/runs/${encodeURIComponent(runId)}`, { method: 'GET' });
  return {
    ...data,
    status: normalizeSolverStatus(data.status),
    is_illustrative: false,
  };
}

/**
 * Retrieve official audit report payload for download
 * GET /runs/{id}/report
 */
export async function fetchRunReport(runId) {
  if (!runId) throw new APIError('Run ID is required', 'SCHEMA_ERROR');
  return await fetchWithTimeout(`/runs/${encodeURIComponent(runId)}/report`, { method: 'GET' });
}

