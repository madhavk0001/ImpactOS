"""ImpactOS Budget Allocation Optimization Engine.

Core mathematical optimization package for public infrastructure project portfolio selection.
Powered by Google OR-Tools CP-SAT.
"""

from optimizer.solver import InputValidationError, solve_portfolio

__all__ = ["solve_portfolio", "InputValidationError"]

