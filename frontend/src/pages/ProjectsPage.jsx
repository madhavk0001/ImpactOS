import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectForm from '../components/projects/ProjectForm';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { EmptyState } from '../components/ui/States';
import { useScenario } from '../context/ScenarioContext';
import { DEPARTMENTS, PLACEHOLDER_DATASET_LABEL } from '../data/demoProjects';
import { formatINR } from '../utils/formatters';

export default function ProjectsPage() {
  const { 
    projects, 
    addProject, 
    updateProject, 
    deleteProject, 
    resetDemoProjects, 
    settings 
  } = useScenario();

  // Slide-over drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Delete modal state
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = departmentFilter === 'ALL' || p.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [projects, searchQuery, departmentFilter]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setDrawerOpen(true);
  };

  const handleFormSubmit = (projectData) => {
    if (editingProject) {
      updateProject(projectData);
    } else {
      addProject(projectData);
    }
    setDrawerOpen(false);
    setEditingProject(null);
  };

  const handleConfirmDelete = (id) => {
    deleteProject(id);
    setProjectToDelete(null);
  };

  const hasPlaceholders = projects.some((p) => p.isPlaceholder);

  return (
    <PageContainer>
      {/* Editorial Header */}
      <PageHeader
        eyebrow="CAPITAL PORTFOLIO INVENTORY"
        title="Candidate Capital"
        italicAccent="Projects"
        description="Comprehensive register of university campus-improvement proposals evaluated against budget ceilings, dependency constraints, and universal accessibility quotas."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={resetDemoProjects}
              title="Reset projects to initial 7 placeholder records"
            >
              Reset Seed Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAdd}
            >
              Add Project
            </Button>
          </div>
        }
      />

      {/* Mandatory Placeholder Dataset Disclosure Banner */}
      {hasPlaceholders && (
        <div className="mb-6 p-4 rounded-panel bg-surface-alt/70 border border-border-hairline text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-terracotta shrink-0" />
            <div>
              <span className="font-semibold text-obsidian uppercase tracking-wider block">
                {PLACEHOLDER_DATASET_LABEL}
              </span>
              <span className="text-secondary-text">
                The current 7 items are synthetic placeholder mock records used strictly for UI layout and validation. They do not represent real university projects.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-taupe-dark bg-surface px-2 py-1 rounded shrink-0 self-start sm:self-auto border border-border-hairline">
            src/data/demoProjects.js
          </span>
        </div>
      )}

      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border-hairline">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search projects by name, code, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded bg-surface border border-border-hairline text-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-secondary-text shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded bg-surface border border-border-hairline text-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
          >
            <option value="ALL">All Departments ({projects.length})</option>
            {DEPARTMENTS.map((dept) => {
              const count = projects.filter((p) => p.department === dept).length;
              return (
                <option key={dept} value={dept}>
                  {dept} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Elias Varr Minimalist Project Table */}
      {filteredProjects.length > 0 ? (
        <Card variant="surface" className="p-0 sm:p-2 overflow-hidden">
          <ProjectTable
            projects={filteredProjects}
            onEdit={handleOpenEdit}
            onDelete={(p) => setProjectToDelete(p)}
          />
        </Card>
      ) : (
        <EmptyState
          title="No candidate projects match your criteria"
          description="Adjust your search query or department filter, or click 'Add Project' to propose a new capital improvement initiative."
          actionLabel="Clear Filter"
          onAction={() => {
            setSearchQuery('');
            setDepartmentFilter('ALL');
          }}
        />
      )}

      {/* Slide-over Drawer for Add/Edit */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        eyebrow={editingProject ? 'Modify Proposal' : 'New Capital Initiative'}
        title={editingProject ? 'Edit Project Specifications' : 'Propose Capital Project'}
      >
        <ProjectForm
          initialProject={editingProject}
          allProjects={projects}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(projectToDelete)}
        project={projectToDelete}
        onConfirm={handleConfirmDelete}
        onClose={() => setProjectToDelete(null)}
      />
    </PageContainer>
  );
}

