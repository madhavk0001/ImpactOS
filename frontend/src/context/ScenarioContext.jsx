import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { DEMO_PROJECTS, DEFAULT_BUDGET_INR } from '../data/demoProjects';
import { ILLUSTRATIVE_RESULTS_FIXTURE } from '../data/illustrativeResults';
import { checkHealth, submitOptimization, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { authAdapter } from '../services/authAdapter';

const ScenarioContext = createContext(null);

const STORAGE_SETTINGS_KEY = 'impactos_app_settings';

// Helper to generate stable snapshot string for stale detection
function generateInputSnapshot(budgetInr, projects) {
  return JSON.stringify({
    budget: Math.round(Number(budgetInr)),
    projects: projects.map((p) => ({
      id: p.id,
      cost: Math.round(Number(p.cost_inr)),
      benefit: Number(p.benefit_score),
      accessible: Boolean(p.accessible),
      dependencies: [...(p.dependencies || [])].sort(),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  });
}

const initialState = {
  // Scenario inputs
  scenarioId: 'scen-baseline-2026',
  scenarioName: 'Baseline FY26-27 Allocation',
  budgetInr: DEFAULT_BUDGET_INR,
  projects: [...DEMO_PROJECTS],

  // Optimization state
  isOptimizing: false,
  optimizationError: null,
  lastResult: null, // Holds solver response or null
  lastRunSnapshot: null, // Input snapshot at time of last optimization run

  // Illustrative preview toggle (OFF by default)
  isIllustrativeActive: false,

  // Session-only real run history
  sessionHistory: [],

  // Backend connection status
  backendStatus: {
    checked: false,
    connected: false,
    checking: false,
    message: 'Probing backend...',
  },

  // App settings
  settings: {
    currencyMode: 'INR_LAKH_CRORE', // 'INR_LAKH_CRORE' | 'INR_FULL' | 'USD_MILLIONS'
    displayDensity: 'comfortable', // 'comfortable' | 'compact'
    apiUrl: getApiBaseUrl(),
  },

  // Current session user
  currentUser: authAdapter.getCurrentUser(),
};

function scenarioReducer(state, action) {
  switch (action.type) {
    case 'SET_BUDGET': {
      return {
        ...state,
        budgetInr: Math.max(0, Math.round(Number(action.payload))),
      };
    }

    case 'ADD_PROJECT': {
      const newProjects = [...state.projects, action.payload];
      return {
        ...state,
        projects: newProjects,
      };
    }

    case 'UPDATE_PROJECT': {
      const updatedProjects = state.projects.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      return {
        ...state,
        projects: updatedProjects,
      };
    }

    case 'DELETE_PROJECT': {
      const filtered = state.projects.filter((p) => p.id !== action.payload);
      return {
        ...state,
        projects: filtered,
      };
    }

    case 'RESET_DEMO_PROJECTS': {
      return {
        ...state,
        budgetInr: DEFAULT_BUDGET_INR,
        projects: [...DEMO_PROJECTS],
      };
    }

    case 'SET_OPTIMIZING': {
      return {
        ...state,
        isOptimizing: action.payload,
        optimizationError: action.payload ? null : state.optimizationError,
      };
    }

    case 'SET_OPTIMIZATION_SUCCESS': {
      const result = action.payload;
      const snapshot = generateInputSnapshot(state.budgetInr, state.projects);

      // Record in session history if genuine run (never store illustrative runs)
      const newHistory = result.is_illustrative
        ? state.sessionHistory
        : [
            {
              run_id: result.run_id,
              status: result.status,
              timestamp: result.timestamp,
              budget_inr: result.total_budget_inr,
              cost_inr: result.total_cost_inr,
              benefit: result.total_benefit,
              funded_count: result.funded_ids.length,
              result_object: result,
            },
            ...state.sessionHistory,
          ];

      return {
        ...state,
        isOptimizing: false,
        optimizationError: null,
        lastResult: result,
        lastRunSnapshot: snapshot,
        sessionHistory: newHistory,
      };
    }

    case 'SET_OPTIMIZATION_ERROR': {
      return {
        ...state,
        isOptimizing: false,
        optimizationError: action.payload,
      };
    }

    case 'TOGGLE_ILLUSTRATIVE_PREVIEW': {
      const nextActive = action.payload !== undefined ? action.payload : !state.isIllustrativeActive;
      if (nextActive) {
        return {
          ...state,
          isIllustrativeActive: true,
          lastResult: {
            ...ILLUSTRATIVE_RESULTS_FIXTURE,
            total_budget_inr: state.budgetInr,
          },
          lastRunSnapshot: generateInputSnapshot(state.budgetInr, state.projects),
        };
      } else {
        // Turn off illustrative preview: if lastResult was illustrative, clear it
        return {
          ...state,
          isIllustrativeActive: false,
          lastResult: state.lastResult?.is_illustrative ? null : state.lastResult,
          lastRunSnapshot: state.lastResult?.is_illustrative ? null : state.lastRunSnapshot,
        };
      }
    }

    case 'SET_BACKEND_STATUS': {
      const backend = action.payload;
      let illustrativeActive = state.isIllustrativeActive;

      // Rule: Automatically disable illustrative preview when backend is reachable
      if (backend.connected && illustrativeActive) {
        illustrativeActive = false;
      }

      return {
        ...state,
        backendStatus: {
          ...state.backendStatus,
          ...backend,
          checked: true,
        },
        isIllustrativeActive: illustrativeActive,
      };
    }

    case 'UPDATE_SETTINGS': {
      const updated = { ...state.settings, ...action.payload };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      if (action.payload.apiUrl) {
        setApiBaseUrl(action.payload.apiUrl);
      }
      return {
        ...state,
        settings: updated,
      };
    }

    case 'SET_USER': {
      return {
        ...state,
        currentUser: action.payload,
      };
    }

    default:
      return state;
  }
}

export function ScenarioProvider({ children }) {
  const [state, dispatch] = useReducer(scenarioReducer, initialState, (init) => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.apiUrl) setApiBaseUrl(parsed.apiUrl);
        return { ...init, settings: { ...init.settings, ...parsed } };
      }
    } catch {
      // Ignore
    }
    return init;
  });

  // Probe backend on mount
  useEffect(() => {
    let isMounted = true;
    async function probe() {
      dispatch({ type: 'SET_BACKEND_STATUS', payload: { checking: true } });
      const health = await checkHealth();
      if (isMounted) {
        dispatch({
          type: 'SET_BACKEND_STATUS',
          payload: {
            connected: health.connected,
            checking: false,
            message: health.connected ? 'Backend connected (FastAPI)' : 'Disconnected (Demo mode active)',
          },
        });
      }
    }
    probe();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stale result state
  const isResultStale = useMemo(() => {
    if (!state.lastResult || !state.lastRunSnapshot) return false;
    const currentSnapshot = generateInputSnapshot(state.budgetInr, state.projects);
    return currentSnapshot !== state.lastRunSnapshot;
  }, [state.budgetInr, state.projects, state.lastResult, state.lastRunSnapshot]);

  // Context Actions
  const runOptimization = async () => {
    dispatch({ type: 'SET_OPTIMIZING', payload: true });
    try {
      const result = await submitOptimization(state.budgetInr, state.projects);
      dispatch({ type: 'SET_OPTIMIZATION_SUCCESS', payload: result });
      return result;
    } catch (error) {
      dispatch({ type: 'SET_OPTIMIZATION_ERROR', payload: error.message || 'Optimization request failed' });
      throw error;
    }
  };

  const toggleIllustrative = (forceVal) => {
    dispatch({ type: 'TOGGLE_ILLUSTRATIVE_PREVIEW', payload: forceVal });
  };

  const setBudget = (budgetInr) => dispatch({ type: 'SET_BUDGET', payload: budgetInr });
  const addProject = (project) => dispatch({ type: 'ADD_PROJECT', payload: project });
  const updateProject = (project) => dispatch({ type: 'UPDATE_PROJECT', payload: project });
  const deleteProject = (id) => dispatch({ type: 'DELETE_PROJECT', payload: id });
  const resetDemoProjects = () => dispatch({ type: 'RESET_DEMO_PROJECTS' });
  const updateSettings = (newSettings) => dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });

  const testBackendConnection = async () => {
    dispatch({ type: 'SET_BACKEND_STATUS', payload: { checking: true } });
    const health = await checkHealth();
    dispatch({
      type: 'SET_BACKEND_STATUS',
      payload: {
        connected: health.connected,
        checking: false,
        message: health.connected ? 'Connected to FastAPI optimization service' : 'Backend unreachable: running in local demo mode',
      },
    });
    return health;
  };

  const loginUser = async (credentials) => {
    const user = await authAdapter.login(credentials);
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  const logoutUser = async () => {
    await authAdapter.logout();
    dispatch({ type: 'SET_USER', payload: null });
  };

  const value = {
    ...state,
    isResultStale,
    runOptimization,
    toggleIllustrative,
    setBudget,
    addProject,
    updateProject,
    deleteProject,
    resetDemoProjects,
    updateSettings,
    testBackendConnection,
    loginUser,
    logoutUser,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}

