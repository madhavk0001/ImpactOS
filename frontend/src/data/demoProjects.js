/**
 * ==============================================================================
 * SAMPLE DATASET — NOT REAL IMPACTOS DATA
 *
 * NOTICE TO DEVELOPERS AND ADMINISTRATORS:
 * The 7 projects defined below are synthetic placeholder mock records created
 * solely for user-interface development, form validation testing, and layout
 * demonstration.
 *
 * THESE VALUES ARE NOT REAL IMPACTOS DATA AND DO NOT REPRESENT REAL INSTITUTIONAL
 * BUDGETS, ACTUAL UNIVERSITY PRIORITIES, OR VERIFIED BENEFIT METRICS.
 *
 * To replace with real institutional data, update the objects in this file or
 * ingest projects from the live FastAPI backend via GET /scenarios/demo.
 * ==============================================================================
 */

export const PLACEHOLDER_DATASET_LABEL = "Sample dataset — not real ImpactOS data";

export const DEFAULT_BUDGET_INR = 50_000_000; // ₹5.00 Crore default envelope

export const DEMO_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Central Science Lab HVAC Modernization",
    department: "Engineering & Sciences",
    cost_inr: 12_500_000, // ₹1.25 Cr
    benefit_score: 84.5,
    accessible: true,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: energy-efficiency and air filtration upgrade for biological and chemical lab suites."
  },
  {
    id: "PRJ-002",
    name: "Campus North Accessible Ramp & Elevator Installation",
    department: "Facilities & Infrastructure",
    cost_inr: 6_800_000, // ₹68.00 L
    benefit_score: 92.0,
    accessible: true,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: barrier-free accessibility overhaul for historical humanities quadrangle."
  },
  {
    id: "PRJ-003",
    name: "High-Density Digital Library Computing Pods",
    department: "Academic Computing",
    cost_inr: 9_200_000, // ₹92.00 L
    benefit_score: 76.0,
    accessible: true,
    dependencies: ["PRJ-005"], // Depends on core fiber backbone
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: 60 student workstation pods with CAD/GIS workstations and adaptive learning tech."
  },
  {
    id: "PRJ-004",
    name: "Student Wellness & Sports Complex Renovation",
    department: "Student Affairs",
    cost_inr: 14_000_000, // ₹1.40 Cr
    benefit_score: 68.5,
    accessible: false,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: timber flooring replacement, mental health counseling annex, and lighting retrofit."
  },
  {
    id: "PRJ-005",
    name: "Next-Gen Optical Fiber Campus Backbone",
    department: "Information Technology",
    cost_inr: 8_500_000, // ₹85.00 L
    benefit_score: 88.0,
    accessible: true,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: 40Gbps underground conduit connecting academic, residential, and lab zones."
  },
  {
    id: "PRJ-006",
    name: "Rooftop Solar Photovoltaic Canopy (Phase 1)",
    department: "Sustainability & Operations",
    cost_inr: 11_000_000, // ₹1.10 Cr
    benefit_score: 79.0,
    accessible: false,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: 350kW solar array across engineering building roofs with real-time metering."
  },
  {
    id: "PRJ-007",
    name: "Performing Arts Auditorium Acoustic Treatment",
    department: "Arts & Humanities",
    cost_inr: 5_500_000, // ₹55.00 L
    benefit_score: 61.0,
    accessible: true,
    dependencies: [],
    isPlaceholder: true,
    placeholderNotice: "Sample project — not real ImpactOS data",
    description: "Synthetic placeholder: acoustic diffusers, assistive listening induction loops, and stage lighting."
  }
];

export const DEPARTMENTS = [
  "Engineering & Sciences",
  "Facilities & Infrastructure",
  "Academic Computing",
  "Student Affairs",
  "Information Technology",
  "Sustainability & Operations",
  "Arts & Humanities",
  "General Administration"
];

