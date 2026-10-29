import React, { useState } from 'react';
import { DEPARTMENTS } from '../../data/demoProjects';
import { formatINR } from '../../utils/formatters';
import Button from '../ui/Button';

export default function ProjectForm({
  initialProject = null,
  allProjects = [],
  onSubmit,
  onCancel,
}) {
  const isEditing = Boolean(initialProject);

  const [formData, setFormData] = useState({
    id: initialProject?.id || `PRJ-${String(allProjects.length + 1).padStart(3, '0')}`,
    name: initialProject?.name || '',
    department: initialProject?.department || DEPARTMENTS[0],
    cost_inr: initialProject?.cost_inr || 5_000_000,
    benefit_score: initialProject?.benefit_score || 75.0,
    accessible: initialProject?.accessible ?? true,
    dependencies: initialProject?.dependencies || [],
    description: initialProject?.description || '',
    isPlaceholder: initialProject?.isPlaceholder ?? false,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Project title is required.';
    } else if (formData.name.length < 5) {
      errs.name = 'Project title must be at least 5 characters.';
    }

    if (!formData.cost_inr || formData.cost_inr <= 0) {
      errs.cost_inr = 'Cost must be a positive integer in INR.';
    }

    if (formData.benefit_score === '' || formData.benefit_score < 0 || formData.benefit_score > 100) {
      errs.benefit_score = 'Benefit score must be between 0 and 100.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      cost_inr: Math.round(Number(formData.cost_inr)),
      benefit_score: Number(formData.benefit_score),
    });
  };

  const toggleDependency = (depId) => {
    setFormData((prev) => {
      const exists = prev.dependencies.includes(depId);
      return {
        ...prev,
        dependencies: exists
          ? prev.dependencies.filter((id) => id !== depId)
          : [...prev.dependencies, depId],
      };
    });
  };

  // Potential dependency candidates (exclude self)
  const availableDependencies = allProjects.filter((p) => p.id !== formData.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Project ID & Name */}
      <div className="space-y-4">
        <div>
          <label htmlFor="project-id" className="block text-editorial-eyebrow text-secondary-text mb-1">
            Project Code Identifier
          </label>
          <input
            id="project-id"
            type="text"
            value={formData.id}
            readOnly={isEditing}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className={`w-full px-3 py-2 text-xs font-mono rounded border ${
              isEditing ? 'bg-surface-alt/50 text-secondary-text cursor-not-allowed border-border-hairline' : 'bg-surface border-border-hairline'
            } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta`}
          />
        </div>

        <div>
          <label htmlFor="project-name" className="block text-editorial-eyebrow text-secondary-text mb-1">
            Project Scope & Title <span className="text-status-error">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Physics Department Cleanroom HVAC Replacement"
            className={`w-full px-3 py-2 text-sm rounded bg-surface border ${
              errors.name ? 'border-status-error' : 'border-border-hairline'
            } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta`}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-status-error mt-1">{errors.name}</p>
          )}
        </div>
      </div>

      {/* Department & Accessibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="project-dept" className="block text-editorial-eyebrow text-secondary-text mb-1">
            Sponsoring Department
          </label>
          <select
            id="project-dept"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded bg-surface border border-border-hairline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="project-score" className="block text-editorial-eyebrow text-secondary-text mb-1">
            Benefit Score (0 – 100) <span className="text-status-error">*</span>
          </label>
          <input
            id="project-score"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={formData.benefit_score}
            onChange={(e) => setFormData({ ...formData, benefit_score: e.target.value })}
            className={`w-full px-3 py-2 text-sm tabular-nums rounded bg-surface border ${
              errors.benefit_score ? 'border-status-error' : 'border-border-hairline'
            } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta`}
          />
          {errors.benefit_score && (
            <p className="text-xs text-status-error mt-1">{errors.benefit_score}</p>
          )}
        </div>
      </div>

      {/* Cost (Integer Rupees) & Real-time formatting */}
      <div>
        <label htmlFor="project-cost" className="block text-editorial-eyebrow text-secondary-text mb-1">
          Estimated Project Cost (Raw Integer Rupees) <span className="text-status-error">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-text text-sm font-semibold">
            ₹
          </span>
          <input
            id="project-cost"
            type="number"
            step="10000"
            min="1000"
            value={formData.cost_inr}
            onChange={(e) => setFormData({ ...formData, cost_inr: e.target.value })}
            className={`w-full pl-8 pr-3 py-2 text-sm tabular-nums rounded bg-surface border ${
              errors.cost_inr ? 'border-status-error' : 'border-border-hairline'
            } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta`}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-secondary-text mt-1.5 px-0.5">
          <span>Indian Lakh / Crore preview:</span>
          <span className="font-semibold text-obsidian tabular-nums">
            {formatINR(formData.cost_inr, { currencyMode: 'INR_LAKH_CRORE' })}
          </span>
        </div>
        {errors.cost_inr && (
          <p className="text-xs text-status-error mt-1">{errors.cost_inr}</p>
        )}
      </div>

      {/* Accessibility Checkbox */}
      <div className="p-3 rounded-lg border border-border-hairline bg-surface-alt/30">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.accessible}
            onChange={(e) => setFormData({ ...formData, accessible: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-border-hairline text-terracotta focus:ring-terracotta"
          />
          <div className="text-xs">
            <span className="font-semibold text-obsidian block">
              ADA / Universal Accessibility Compliance
            </span>
            <span className="text-secondary-text">
              Project incorporates barrier-free design, elevators, ramps, or assistive sensory technologies.
            </span>
          </div>
        </label>
      </div>

      {/* Dependencies Multi-Select */}
      {availableDependencies.length > 0 && (
        <div>
          <label className="block text-editorial-eyebrow text-secondary-text mb-1.5">
            Prerequisite Dependencies (Optional)
          </label>
          <p className="text-xs text-secondary-text mb-2">
            Select prerequisite capital projects that must be funded before this project can proceed:
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded border border-border-hairline bg-surface">
            {availableDependencies.map((dep) => (
              <label 
                key={dep.id} 
                className="flex items-center space-x-2 text-xs text-charcoal hover:bg-surface-alt/60 p-1.5 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.dependencies.includes(dep.id)}
                  onChange={() => toggleDependency(dep.id)}
                  className="rounded border-border-hairline text-terracotta focus:ring-terracotta"
                />
                <span className="font-mono text-[10px] text-secondary-text font-semibold">{dep.id}</span>
                <span className="truncate">{dep.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="project-desc" className="block text-editorial-eyebrow text-secondary-text mb-1">
          Technical Notes / Justification
        </label>
        <textarea
          id="project-desc"
          rows="2"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed engineering scope or institutional justification..."
          className="w-full px-3 py-2 text-xs rounded bg-surface border border-border-hairline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-hairline">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="md" type="submit">
          {isEditing ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

