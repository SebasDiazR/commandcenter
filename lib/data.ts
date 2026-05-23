import type { RawData } from "./types";

export const RAW_DATA: RawData = {
  metadata: {
    title: "HKS Texas Higher Education BD Pipeline",
    sources: [
      "THECB Capital Expenditure Plan FY2026–2030 (September 2025)",
      "HKS BD Session 05/19–20/26",
    ],
    pipeline_total_b: 12.4,
    project_count: 87,
    attendees: ["BD Team", "Practice Leaders"],
  },

  funding_sources: [
    { name: "State Appropriations",        total_m: 4_200, pct: 33.9 },
    { name: "Revenue Bonds",               total_m: 3_100, pct: 25.0 },
    { name: "Tuition & Fees (PUF/AUF)",   total_m: 2_400, pct: 19.4 },
    { name: "Federal Grants (CHIPS / IRA)",total_m: 1_350, pct: 10.9 },
    { name: "Philanthropy & Gifts",        total_m:   900, pct:  7.3 },
    { name: "Public-Private Partnerships", total_m:   450, pct:  3.6 },
  ],

  project_types: [
    { name: "New Construction", count: 38, total_b: 6.1,  pct: 49.2 },
    { name: "Renovation",       count: 24, total_b: 3.2,  pct: 25.8 },
    { name: "Addition",         count: 12, total_b: 1.8,  pct: 14.5 },
    { name: "Infrastructure",   count:  8, total_b: 0.9,  pct:  7.3 },
    { name: "Master Plan",      count:  5, total_b: 0.4,  pct:  3.2 },
  ],

  fy_expenditures: [
    { year: "FY2026", total_m: 1_800, pct: 14.5 },
    { year: "FY2027", total_m: 2_600, pct: 21.0 },
    { year: "FY2028", total_m: 3_100, pct: 25.0 },
    { year: "FY2029", total_m: 2_900, pct: 23.4 },
    { year: "FY2030", total_m: 2_000, pct: 16.1 },
  ],

  institutions: [
    // ── UT System ─────────────────────────────────────────────────────────
    {
      name: "University of Texas at Austin",
      system: "UT System",
      strategy_priority: 9,
      thecb_total_m: 1_850,
      lead_practice: "Academic",
      strategy_notes: "Flagship — STEM quad expansion + new engineering hall priority",
      contacts: [
        { name: "Dr. Sarah Chen", notes: "VP Facilities — met at SCUP 2025" },
        { name: "Marcus Webb",    notes: "Capital Projects Director" },
      ],
      projects: [
        { _id: "ut-1", name: "Engineering Education & Research Center", budget_m: 450, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "ut-2", name: "Gates Dell Complex Renovation",           budget_m: 120, year: 2026, type: "Renovation",       source: "thecb" },
        { _id: "ut-3", name: "Student Activity Center Expansion",       budget_m:  85, year: 2028, type: "Addition",         source: "strategy" },
        { _id: "ut-4", name: "Darrell K Royal Stadium Modernization",   budget_m: 280, year: 2027, type: "Renovation",       source: "thecb" },
      ],
      gsf: 28_000_000, nasf: 17_400_000, eg_nasf: 4_200_000,
    },
    {
      name: "UT Dallas",
      system: "UT Dallas",
      strategy_priority: 8,
      thecb_total_m: 640,
      lead_practice: "Science + Technology",
      strategy_notes: "Rapid enrollment growth — STEM focus, strong research trajectory",
      contacts: [
        { name: "Dr. Priya Nair", notes: "Provost office — introduced by Tom Baber" },
      ],
      projects: [
        { _id: "utd-1", name: "Bioengineering & Life Sciences Building", budget_m: 210, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "utd-2", name: "Student Union Renovation Phase II",       budget_m:  55, year: 2026, type: "Renovation",       source: "strategy" },
        { _id: "utd-3", name: "Arts & Humanities Center",                budget_m: 120, year: 2029, type: "New Construction", source: "thecb" },
      ],
      gsf: 6_200_000, nasf: 3_900_000, eg_nasf: 980_000,
    },
    {
      name: "UT San Antonio",
      system: "UTSA",
      strategy_priority: 7,
      thecb_total_m: 520,
      lead_practice: "Academic",
      strategy_notes: "Downtown campus expansion — active master plan process",
      contacts: [],
      projects: [
        { _id: "utsa-1", name: "National Security Collaboration Center", budget_m: 180, year: 2026, type: "New Construction", source: "thecb" },
        { _id: "utsa-2", name: "Sombrilla Central Plaza Renovation",     budget_m:  40, year: 2027, type: "Renovation",       source: "strategy" },
        { _id: "utsa-3", name: "College of Business Expansion",          budget_m: 140, year: 2028, type: "Addition",         source: "thecb" },
      ],
      gsf: 7_100_000, nasf: 4_500_000, eg_nasf: null,
    },
    {
      name: "UT Arlington",
      system: "UT Arlington",
      strategy_priority: 6,
      thecb_total_m: 390,
      lead_practice: "Academic",
      strategy_notes: "Innovation district partnership — DFW aerospace cluster",
      contacts: [
        { name: "Linda Torres", notes: "Facilities VP" },
      ],
      projects: [
        { _id: "uta-1", name: "Science & Engineering Innovation Hall", budget_m: 160, year: 2028, type: "New Construction", source: "thecb" },
        { _id: "uta-2", name: "Central Library Modernization",         budget_m:  65, year: 2026, type: "Renovation",       source: "strategy" },
      ],
      gsf: 9_200_000, nasf: 5_800_000, eg_nasf: 1_400_000,
    },

    // ── Texas A&M System ───────────────────────────────────────────────────
    {
      name: "Texas A&M University",
      system: "Texas A&M",
      strategy_priority: 9,
      thecb_total_m: 2_100,
      lead_practice: "Science + Technology",
      strategy_notes: "Largest endowment in Texas — RELLIS campus expansion is key opportunity",
      contacts: [
        { name: "Col. James Park",  notes: "VP for Facilities — Aggie Network connection" },
        { name: "Dr. Elena Reyes",  notes: "VP Research — HESTEC relationship" },
      ],
      projects: [
        { _id: "tam-1", name: "RELLIS Campus Phase 3 — Advanced Manufacturing",  budget_m: 380, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "tam-2", name: "Bush Combat Development Complex Expansion",        budget_m: 220, year: 2026, type: "Addition",         source: "thecb" },
        { _id: "tam-3", name: "Texas A&M Health Science Center — Round Rock",    budget_m: 310, year: 2028, type: "New Construction", source: "thecb" },
        { _id: "tam-4", name: "Kyle Field West Side Renovation",                 budget_m: 290, year: 2029, type: "Renovation",       source: "strategy" },
        { _id: "tam-5", name: "Zachry Engineering Education Complex Ph. II",     budget_m: 150, year: 2027, type: "Addition",         source: "thecb" },
      ],
      gsf: 35_000_000, nasf: 22_000_000, eg_nasf: 5_800_000,
    },
    {
      name: "Texas A&M San Antonio",
      system: "Texas A&M",
      strategy_priority: 5,
      thecb_total_m: 280,
      lead_practice: "Civic + Culture",
      strategy_notes: "New campus — still in early build-out phase, land acquired 2024",
      contacts: [],
      projects: [
        { _id: "tamsa-1", name: "Main Academic Building Phase 2", budget_m: 140, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "tamsa-2", name: "Student Services Center",        budget_m:  65, year: 2028, type: "New Construction", source: "thecb" },
      ],
      gsf: 520_000, nasf: 320_000, eg_nasf: null,
    },
    {
      name: "Prairie View A&M",
      system: "Texas A&M",
      strategy_priority: 6,
      thecb_total_m: 310,
      lead_practice: "Residential",
      strategy_notes: "HBCU — strong federal CHIPS/IRA eligibility; housing demand critical",
      contacts: [
        { name: "Dr. Amara Osei", notes: "Provost — DEI initiative alignment" },
      ],
      projects: [
        { _id: "pvam-1", name: "STEM Research & Innovation Center",   budget_m: 120, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "pvam-2", name: "New Residence Hall Complex (500 beds)",budget_m:  90, year: 2026, type: "New Construction", source: "strategy" },
        { _id: "pvam-3", name: "W.R. Banks Library Renovation",       budget_m:  45, year: 2028, type: "Renovation",       source: "thecb" },
      ],
      gsf: 2_100_000, nasf: 1_300_000, eg_nasf: null,
    },

    // ── Texas Tech System ──────────────────────────────────────────────────
    {
      name: "Texas Tech University",
      system: "TTU System",
      strategy_priority: 7,
      thecb_total_m: 780,
      lead_practice: "Health + Wellness",
      strategy_notes: "Medical school expansion + athletics complex — both active pursuits",
      contacts: [
        { name: "Bob Garrison", notes: "VP Administration — met THECB conference 2025" },
      ],
      projects: [
        { _id: "ttu-1", name: "School of Medicine Phase 2 — Lubbock",       budget_m: 220, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "ttu-2", name: "Jones AT&T Stadium North End Zone",           budget_m: 175, year: 2026, type: "Addition",         source: "strategy" },
        { _id: "ttu-3", name: "Rawls College of Business Renovation",        budget_m:  80, year: 2028, type: "Renovation",       source: "thecb" },
        { _id: "ttu-4", name: "Research Village Infrastructure Phase 1",     budget_m: 110, year: 2027, type: "Infrastructure",   source: "thecb" },
      ],
      gsf: 14_000_000, nasf: 9_000_000, eg_nasf: 2_200_000,
    },
    {
      name: "TTU Health Sciences Center",
      system: "TTU System",
      strategy_priority: 6,
      thecb_total_m: 340,
      lead_practice: "Health + Wellness",
      strategy_notes: "El Paso and Amarillo campuses active — nursing/pharmacy priority",
      contacts: [],
      projects: [
        { _id: "ttuhsc-1", name: "El Paso Clinical Sciences Building",  budget_m: 130, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "ttuhsc-2", name: "Amarillo Simulation Center",          budget_m:  75, year: 2026, type: "New Construction", source: "strategy" },
      ],
      gsf: 2_800_000, nasf: 1_750_000, eg_nasf: null,
    },

    // ── University of Houston System ───────────────────────────────────────
    {
      name: "University of Houston",
      system: "UH System",
      strategy_priority: 8,
      thecb_total_m: 890,
      lead_practice: "Urban Design",
      strategy_notes: "Energy corridor + Innovation District — strong municipal partnership",
      contacts: [
        { name: "Dr. Keiko Yamamoto", notes: "Dean, College of Architecture" },
        { name: "Steve Plata",        notes: "Capital Planning — former HKS client" },
      ],
      projects: [
        { _id: "uh-1", name: "Energy Research Park Building 2",          budget_m: 260, year: 2027, type: "New Construction", source: "thecb" },
        { _id: "uh-2", name: "Student Housing Village Phase 3 (800 beds)",budget_m: 180, year: 2026, type: "New Construction", source: "thecb" },
        { _id: "uh-3", name: "Cougar Village II Renovation",              budget_m:  60, year: 2027, type: "Renovation",       source: "strategy" },
        { _id: "uh-4", name: "Fertitta Center Expansion",                 budget_m: 120, year: 2029, type: "Addition",         source: "thecb" },
      ],
      gsf: 16_500_000, nasf: 10_200_000, eg_nasf: 2_600_000,
    },
    {
      name: "UH Clear Lake",
      system: "UH System",
      strategy_priority: 4,
      thecb_total_m: 180,
      lead_practice: "Science + Technology",
      strategy_notes: "NASA/JSC adjacency — aerospace-focused research growth",
      contacts: [],
      projects: [
        { _id: "uhcl-1", name: "STEM & Research Building",       budget_m: 95, year: 2028, type: "New Construction", source: "thecb" },
        { _id: "uhcl-2", name: "Student Services Building Reno", budget_m: 30, year: 2027, type: "Renovation",       source: "strategy" },
      ],
      gsf: 1_600_000, nasf: 980_000, eg_nasf: null,
    },

    // ── Independent / Other ────────────────────────────────────────────────
    {
      name: "Texas State University",
      system: "Independent",
      strategy_priority: 6,
      thecb_total_m: 460,
      lead_practice: "Student Life",
      strategy_notes: "Fast-growing — enrollment 40k+ and climbing; housing demand acute",
      contacts: [
        { name: "Maria Gonzalez", notes: "Facilities Director — San Marcos campus" },
      ],
      projects: [
        { _id: "txst-1", name: "Bobcat Stadium Renovation",                budget_m: 140, year: 2027, type: "Renovation",       source: "strategy" },
        { _id: "txst-2", name: "New Residence Hall (600 beds) – Round Rock",budget_m: 110, year: 2026, type: "New Construction", source: "thecb" },
        { _id: "txst-3", name: "Applied Arts Building Replacement",        budget_m:  95, year: 2028, type: "New Construction", source: "thecb" },
      ],
      gsf: 9_800_000, nasf: 6_100_000, eg_nasf: 1_500_000,
    },
    {
      name: "University of North Texas",
      system: "UNT System",
      strategy_priority: 5,
      thecb_total_m: 320,
      lead_practice: "Academic",
      strategy_notes: "DFW growth — music/arts college nationally recognized",
      contacts: [],
      projects: [
        { _id: "unt-1", name: "College of Music New Building",         budget_m: 120, year: 2028, type: "New Construction", source: "thecb" },
        { _id: "unt-2", name: "Hurley Administration Building Reno",   budget_m:  45, year: 2026, type: "Renovation",       source: "strategy" },
        { _id: "unt-3", name: "Mean Green Village Housing Phase 2",    budget_m:  80, year: 2027, type: "New Construction", source: "thecb" },
      ],
      gsf: 8_400_000, nasf: 5_200_000, eg_nasf: null,
    },
    {
      name: "Baylor University",
      system: "Independent",
      strategy_priority: 7,
      thecb_total_m: 540,
      lead_practice: "Health + Wellness",
      strategy_notes: "Private — Baylor Scott & White medical school expansion is primary opportunity",
      contacts: [
        { name: "Dr. Todd Morrison", notes: "VP Research — medical school steering committee" },
      ],
      projects: [
        { _id: "bay-1", name: "Baylor College of Medicine Waco Campus Phase 1", budget_m: 210, year: 2027, type: "New Construction", source: "strategy" },
        { _id: "bay-2", name: "McLane Stadium North Tower Expansion",           budget_m: 130, year: 2026, type: "Addition",         source: "strategy" },
        { _id: "bay-3", name: "Research at the Ridge — Building 3",             budget_m:  95, year: 2028, type: "New Construction", source: "thecb" },
      ],
      gsf: 7_200_000, nasf: 4_600_000, eg_nasf: 1_100_000,
    },
    {
      name: "Texas Christian University",
      system: "Independent",
      strategy_priority: 5,
      thecb_total_m: 240,
      lead_practice: "Student Life",
      strategy_notes: "Private — campus master plan underway; strong alumni giving",
      contacts: [],
      projects: [
        { _id: "tcu-1", name: "Health, Wellness & Athletics Complex", budget_m: 150, year: 2028, type: "New Construction", source: "strategy" },
        { _id: "tcu-2", name: "Brown-Lupton University Union Reno",   budget_m:  60, year: 2027, type: "Renovation",       source: "strategy" },
      ],
      gsf: 5_100_000, nasf: 3_200_000, eg_nasf: null,
    },
    {
      name: "Rice University",
      system: "Independent",
      strategy_priority: 6,
      thecb_total_m: 380,
      lead_practice: "Science + Technology",
      strategy_notes: "Private R1 — Quantum computing and bioengineering investment cycle",
      contacts: [
        { name: "Dr. Cynthia Ruiz", notes: "VP Facilities — former colleague of Jamie K." },
      ],
      projects: [
        { _id: "rice-1", name: "Quantum Research Center",              budget_m: 180, year: 2027, type: "New Construction", source: "strategy" },
        { _id: "rice-2", name: "Lovett Hall Restoration",              budget_m:  45, year: 2026, type: "Renovation",       source: "strategy" },
        { _id: "rice-3", name: "BioScience Research Collaborative Ph2",budget_m: 110, year: 2028, type: "Addition",         source: "thecb" },
      ],
      gsf: 6_800_000, nasf: 4_300_000, eg_nasf: 1_050_000,
    },
  ],
};
