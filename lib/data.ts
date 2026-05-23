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
    { name: "State Appropriations",         total_m: 4_200, pct: 33.9 },
    { name: "Revenue Bonds",                total_m: 3_100, pct: 25.0 },
    { name: "Tuition & Fees (PUF/AUF)",    total_m: 2_400, pct: 19.4 },
    { name: "Federal Grants (CHIPS / IRA)", total_m: 1_350, pct: 10.9 },
    { name: "Philanthropy & Gifts",         total_m:   900, pct:  7.3 },
    { name: "Public-Private Partnerships",  total_m:   450, pct:  3.6 },
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
    // ── UT Austin ─────────────────────────────────────────────────────────
    {
      name: "University of Texas at Austin",
      system: "UT System",
      strategy_priority: 9,
      thecb_total_m: 1_850,
      lead_practice: "Science + Technology",
      strategy_notes: "Flagship — STEM quad expansion + engineering hall primary opportunity. Strong Cockrell School relationship.",
      contacts: [
        { name: "Dr. Sarah Chen",  notes: "VP Facilities — met at SCUP 2025, responsive" },
        { name: "Marcus Webb",     notes: "Capital Projects Director — prefers quarterly touchpoints" },
        { name: "Priya Nair",      notes: "Provost Office liaison — DEI + STEM alignment" },
      ],
      projects: [
        { _id: "uta-1",  name: "Engineering Education & Research Center Phase 1", budget_m: 450, year: 2027, type: "New Construction", source: "thecb", notes: "Cockrell School flagship — 280K GSF, LEED Gold target" },
        { _id: "uta-2",  name: "Gates Dell Complex Renovation",                   budget_m: 120, year: 2026, type: "Renovation",       source: "thecb", notes: "Computer science + CS modernization, occupied renovation" },
        { _id: "uta-3",  name: "Student Activity Center Expansion",               budget_m:  85, year: 2028, type: "Addition",         source: "strategy", notes: "West campus connector — student union expansion" },
        { _id: "uta-4",  name: "DKR Stadium North End Zone Modernization",        budget_m: 280, year: 2027, type: "Renovation",       source: "thecb", notes: "Premium seating, premium club spaces, new scoreboard zone" },
        { _id: "uta-5",  name: "UT Dell Medical Center Research Tower",           budget_m: 310, year: 2028, type: "New Construction", source: "thecb", notes: "Clinical research, partnerships with Dell Technologies" },
        { _id: "uta-6",  name: "Jackson School Geosciences Building",             budget_m:  95, year: 2029, type: "New Construction", source: "strategy", notes: "Energy + climate research focus, Pickle Campus adjacent" },
        { _id: "uta-7",  name: "Blanton Museum Expansion",                        budget_m:  60, year: 2030, type: "Addition",         source: "strategy", notes: "Arts campus expansion, gift-funded" },
        { _id: "uta-8",  name: "Campus Utility Infrastructure Phase 2",           budget_m: 140, year: 2026, type: "Infrastructure",   source: "thecb", notes: "Central chilled water, electrical backbone" },
      ],
      gsf: 28_000_000, nasf: 17_400_000, eg_nasf: 4_200_000,
    },

    // ── UT Dallas ─────────────────────────────────────────────────────────
    {
      name: "UT Dallas",
      system: "UT System",
      strategy_priority: 8,
      thecb_total_m: 640,
      lead_practice: "Science + Technology",
      strategy_notes: "Rapid enrollment growth — STEM focus, strong research trajectory. R1 designation earned 2023.",
      contacts: [
        { name: "Dr. Priya Nair",   notes: "Provost office — introduced by Tom Baber" },
        { name: "Wei Zhang",        notes: "VP Research — semiconductor focus, CHIPS Act funding" },
      ],
      projects: [
        { _id: "utd-1", name: "Bioengineering & Life Sciences Building",     budget_m: 210, year: 2027, type: "New Construction", source: "thecb", notes: "Flagship STEM — 120K GSF, cleanroom, wet labs" },
        { _id: "utd-2", name: "Student Union Renovation Phase II",           budget_m:  55, year: 2026, type: "Renovation",       source: "strategy", notes: "Student services consolidation" },
        { _id: "utd-3", name: "Arts & Humanities Center",                    budget_m: 120, year: 2029, type: "New Construction", source: "thecb", notes: "Performing arts + gallery, campus landmark" },
        { _id: "utd-4", name: "Engineering & Computer Science Phase 3",      budget_m: 180, year: 2028, type: "Addition",         source: "thecb", notes: "ECS enrollment surge requires capacity expansion" },
        { _id: "utd-5", name: "Residence Hall West Campus (500 beds)",       budget_m:  95, year: 2027, type: "New Construction", source: "strategy", notes: "Housing demand — graduate + international students" },
      ],
      gsf: 6_200_000, nasf: 3_900_000, eg_nasf: 980_000,
    },

    // ── UT San Antonio ────────────────────────────────────────────────────
    {
      name: "UT San Antonio",
      system: "UT System",
      strategy_priority: 7,
      thecb_total_m: 520,
      lead_practice: "Civic + Culture",
      strategy_notes: "Downtown campus expansion — active master plan. Military City connections, cybersecurity focus.",
      contacts: [
        { name: "Maria Gonzalez",  notes: "VP Facilities — San Antonio native, long tenure" },
      ],
      projects: [
        { _id: "utsa-1", name: "National Security Collaboration Center Ph2", budget_m: 180, year: 2026, type: "New Construction", source: "thecb", notes: "Cybersecurity + DoD partnership, downtown campus" },
        { _id: "utsa-2", name: "Sombrilla Central Plaza Renovation",         budget_m:  40, year: 2027, type: "Renovation",       source: "strategy", notes: "Campus heart reconnection, landscaping + hardscape" },
        { _id: "utsa-3", name: "College of Business Expansion",              budget_m: 140, year: 2028, type: "Addition",         source: "thecb", notes: "Growing enrollment needs additional classroom capacity" },
        { _id: "utsa-4", name: "Downtown Campus Housing Tower (400 beds)",   budget_m: 120, year: 2027, type: "New Construction", source: "strategy", notes: "First purpose-built housing at downtown campus" },
        { _id: "utsa-5", name: "Innovation Lab + Maker Space",               budget_m:  45, year: 2029, type: "Renovation",       source: "strategy", notes: "Entrepreneurship hub, existing building adaptive reuse" },
      ],
      gsf: 7_100_000, nasf: 4_500_000, eg_nasf: null,
    },

    // ── UT Arlington ──────────────────────────────────────────────────────
    {
      name: "UT Arlington",
      system: "UT System",
      strategy_priority: 6,
      thecb_total_m: 390,
      lead_practice: "Academic",
      strategy_notes: "Innovation district partnership — DFW aerospace cluster. Second largest UT campus by enrollment.",
      contacts: [
        { name: "Linda Torres", notes: "Facilities VP — direct, prefers written briefs" },
        { name: "Dr. James Park", notes: "Dean Engineering — former Boeing executive" },
      ],
      projects: [
        { _id: "uta-utar-1", name: "Science & Engineering Innovation Hall", budget_m: 160, year: 2028, type: "New Construction", source: "thecb", notes: "Aerospace engineering + advanced manufacturing" },
        { _id: "uta-utar-2", name: "Central Library Modernization",         budget_m:  65, year: 2026, type: "Renovation",       source: "strategy", notes: "Digital commons + maker space integration" },
        { _id: "uta-utar-3", name: "Health Professions Building",           budget_m:  90, year: 2029, type: "New Construction", source: "thecb", notes: "Nursing + kinesiology colocation" },
      ],
      gsf: 9_200_000, nasf: 5_800_000, eg_nasf: 1_400_000,
    },

    // ── UT El Paso ────────────────────────────────────────────────────────
    {
      name: "UT El Paso",
      system: "UT System",
      strategy_priority: 5,
      thecb_total_m: 280,
      lead_practice: "Civic + Culture",
      strategy_notes: "HSI — border region + DoD Fort Bliss partnership. National prominence in Hispanic student success.",
      contacts: [
        { name: "Roberto Fuentes", notes: "VP Facilities — El Paso native, alumni" },
      ],
      projects: [
        { _id: "utep-1", name: "Engineering Complex Phase 2",               budget_m: 110, year: 2027, type: "Addition",         source: "thecb", notes: "UTEP-Fort Bliss research corridor" },
        { _id: "utep-2", name: "Student Success Center",                    budget_m:  55, year: 2026, type: "New Construction", source: "thecb", notes: "Academic support + advising consolidation" },
        { _id: "utep-3", name: "Campus Entry + Streetscape Master Plan",    budget_m:  35, year: 2028, type: "Master Plan",      source: "strategy", notes: "Mesa/University corridor redesign" },
      ],
      gsf: 5_800_000, nasf: 3_600_000, eg_nasf: null,
    },

    // ── Texas A&M ─────────────────────────────────────────────────────────
    {
      name: "Texas A&M University",
      system: "Texas A&M",
      strategy_priority: 9,
      thecb_total_m: 2_100,
      lead_practice: "Science + Technology",
      strategy_notes: "Largest endowment in Texas — RELLIS campus expansion is key opportunity. Engineering + agriculture + military powerhouse.",
      contacts: [
        { name: "Col. James Park",  notes: "VP Facilities — Aggie Network connection, responsive" },
        { name: "Dr. Elena Reyes",  notes: "VP Research — HESTEC relationship, strong science focus" },
        { name: "Bob Garrison",     notes: "Capital Projects — met THECB conference 2025" },
      ],
      projects: [
        { _id: "tam-1",  name: "RELLIS Campus Ph3 — Advanced Manufacturing Hub",  budget_m: 380, year: 2027, type: "New Construction", source: "thecb", notes: "Industry partnership center, 240K GSF" },
        { _id: "tam-2",  name: "Bush Combat Development Complex Expansion",        budget_m: 220, year: 2026, type: "Addition",         source: "thecb", notes: "DoD-partnered simulation + training facilities" },
        { _id: "tam-3",  name: "Texas A&M Health Science Center — Round Rock",    budget_m: 310, year: 2028, type: "New Construction", source: "thecb", notes: "Medical school satellite, clinical training" },
        { _id: "tam-4",  name: "Kyle Field West Side Renovation",                 budget_m: 290, year: 2029, type: "Renovation",       source: "strategy", notes: "Premium clubs, west deck modernization" },
        { _id: "tam-5",  name: "Zachry Engineering Education Complex Ph2",        budget_m: 150, year: 2027, type: "Addition",         source: "thecb", notes: "Hands-on learning labs, fabrication spaces" },
        { _id: "tam-6",  name: "Agriculture & Life Sciences Research Center",     budget_m: 175, year: 2028, type: "New Construction", source: "thecb", notes: "Flagship agritech research, genomics + biotech" },
        { _id: "tam-7",  name: "New Student Residence Complex (800 beds)",        budget_m: 160, year: 2026, type: "New Construction", source: "strategy", notes: "South campus housing, student demand critical" },
        { _id: "tam-8",  name: "Memorial Student Center Renovation Phase 3",      budget_m:  85, year: 2027, type: "Renovation",       source: "strategy", notes: "Continuing phased MSC renewal project" },
        { _id: "tam-9",  name: "RELLIS Campus Utility + Infrastructure",          budget_m: 120, year: 2026, type: "Infrastructure",   source: "thecb", notes: "Chilled water, fiber, road network" },
      ],
      gsf: 35_000_000, nasf: 22_000_000, eg_nasf: 5_800_000,
    },

    // ── Texas A&M San Antonio ─────────────────────────────────────────────
    {
      name: "Texas A&M San Antonio",
      system: "Texas A&M",
      strategy_priority: 5,
      thecb_total_m: 280,
      lead_practice: "Civic + Culture",
      strategy_notes: "New campus — still in early build-out phase, land acquired 2024. Growing SA enrollment.",
      contacts: [],
      projects: [
        { _id: "tamsa-1", name: "Main Academic Building Phase 2",  budget_m: 140, year: 2027, type: "New Construction", source: "thecb", notes: "Lecture halls + labs, 90K GSF" },
        { _id: "tamsa-2", name: "Student Services Center",         budget_m:  65, year: 2028, type: "New Construction", source: "thecb", notes: "Enrollment, advising, student success" },
        { _id: "tamsa-3", name: "Campus Master Plan Update",       budget_m:  12, year: 2026, type: "Master Plan",      source: "strategy", notes: "Phased growth plan through 2040" },
      ],
      gsf: 520_000, nasf: 320_000, eg_nasf: null,
    },

    // ── Prairie View A&M ──────────────────────────────────────────────────
    {
      name: "Prairie View A&M University",
      system: "Texas A&M",
      strategy_priority: 6,
      thecb_total_m: 310,
      lead_practice: "Science + Technology",
      strategy_notes: "HBCU — strong federal CHIPS/IRA eligibility; housing demand critical. National recognition for engineering.",
      contacts: [
        { name: "Dr. Amara Osei",  notes: "Provost — DEI initiative alignment, enthusiastic" },
        { name: "James Ellington", notes: "Facilities Director — practical, budget-focused" },
      ],
      projects: [
        { _id: "pvam-1", name: "STEM Research & Innovation Center",    budget_m: 120, year: 2027, type: "New Construction", source: "thecb", notes: "HBCU CHIPS Act opportunity, semiconductor focus" },
        { _id: "pvam-2", name: "Residence Hall Complex (500 beds)",    budget_m:  90, year: 2026, type: "New Construction", source: "strategy", notes: "Housing critical to enrollment growth" },
        { _id: "pvam-3", name: "W.R. Banks Library Renovation",       budget_m:  45, year: 2028, type: "Renovation",       source: "thecb", notes: "Digital commons + study transformation" },
        { _id: "pvam-4", name: "Athletic Complex Expansion",          budget_m:  55, year: 2029, type: "Addition",         source: "strategy", notes: "SWAC competition facility improvements" },
      ],
      gsf: 2_100_000, nasf: 1_300_000, eg_nasf: null,
    },

    // ── Tarleton State ────────────────────────────────────────────────────
    {
      name: "Tarleton State University",
      system: "Texas A&M",
      strategy_priority: 4,
      thecb_total_m: 190,
      lead_practice: "Academic",
      strategy_notes: "Fort Worth campus rapid growth — fastest growing A&M System campus by enrollment.",
      contacts: [],
      projects: [
        { _id: "tsu-1", name: "Fort Worth Campus Academic Building Ph2", budget_m:  95, year: 2027, type: "New Construction", source: "thecb", notes: "FW campus expansion, urban professional programs" },
        { _id: "tsu-2", name: "Stephenville Recreation Center Reno",    budget_m:  40, year: 2028, type: "Renovation",       source: "strategy", notes: "Student life modernization, main campus" },
      ],
      gsf: 2_800_000, nasf: 1_700_000, eg_nasf: null,
    },

    // ── Texas Tech ────────────────────────────────────────────────────────
    {
      name: "Texas Tech University",
      system: "TTU System",
      strategy_priority: 7,
      thecb_total_m: 780,
      lead_practice: "Health + Wellness",
      strategy_notes: "Medical school expansion + athletics complex — both active pursuits. Lubbock's anchor institution.",
      contacts: [
        { name: "Bob Garrison",    notes: "VP Admin — met THECB conference 2025, direct communicator" },
        { name: "Dr. Kim Torres",  notes: "Dean Medicine — recent hire from UT Southwestern" },
      ],
      projects: [
        { _id: "ttu-1", name: "School of Medicine Phase 2 — Lubbock",        budget_m: 220, year: 2027, type: "New Construction", source: "thecb", notes: "Clinical simulation + gross anatomy, 140K GSF" },
        { _id: "ttu-2", name: "Jones AT&T Stadium North End Zone",           budget_m: 175, year: 2026, type: "Addition",         source: "strategy", notes: "Big 12 premium experience, club expansion" },
        { _id: "ttu-3", name: "Rawls College of Business Renovation",        budget_m:  80, year: 2028, type: "Renovation",       source: "thecb", notes: "Full interior renovation + exterior refresh" },
        { _id: "ttu-4", name: "Research Village Infrastructure Phase 1",     budget_m: 110, year: 2027, type: "Infrastructure",   source: "thecb", notes: "Innovation district utility + road backbone" },
        { _id: "ttu-5", name: "New Engineering Building — Electrical/CE",    budget_m: 140, year: 2029, type: "New Construction", source: "thecb", notes: "EE + CE growth accommodation" },
        { _id: "ttu-6", name: "Honors Residential College",                  budget_m:  75, year: 2028, type: "New Construction", source: "strategy", notes: "Live-learn community, 350-bed model" },
      ],
      gsf: 14_000_000, nasf: 9_000_000, eg_nasf: 2_200_000,
    },

    // ── TTUHSC ────────────────────────────────────────────────────────────
    {
      name: "TTU Health Sciences Center",
      system: "TTU System",
      strategy_priority: 6,
      thecb_total_m: 340,
      lead_practice: "Health + Wellness",
      strategy_notes: "El Paso and Amarillo campuses active — nursing/pharmacy priority. Rural health reach.",
      contacts: [
        { name: "Dr. Laura Sandoval", notes: "Dean Nursing — Amarillo campus champion" },
      ],
      projects: [
        { _id: "ttuhsc-1", name: "El Paso Clinical Sciences Building",   budget_m: 130, year: 2027, type: "New Construction", source: "thecb", notes: "TTUHSC-EP primary academic + clinic facility" },
        { _id: "ttuhsc-2", name: "Amarillo Simulation Center",           budget_m:  75, year: 2026, type: "New Construction", source: "strategy", notes: "High-fidelity clinical simulation, 40K GSF" },
        { _id: "ttuhsc-3", name: "Midland-Odessa Nursing Education Hub", budget_m:  50, year: 2028, type: "New Construction", source: "strategy", notes: "Permian Basin healthcare workforce pipeline" },
      ],
      gsf: 2_800_000, nasf: 1_750_000, eg_nasf: null,
    },

    // ── University of Houston ─────────────────────────────────────────────
    {
      name: "University of Houston",
      system: "UH System",
      strategy_priority: 8,
      thecb_total_m: 890,
      lead_practice: "Urban Design",
      strategy_notes: "Energy corridor + Innovation District — strong municipal partnership. AAU aspirant, R1 status.",
      contacts: [
        { name: "Dr. Keiko Yamamoto", notes: "Dean, College of Architecture — long relationship" },
        { name: "Steve Plata",        notes: "Capital Planning — former HKS client, champion" },
        { name: "Rashida Okonkwo",    notes: "Diversity + Equity office — community engagement lead" },
      ],
      projects: [
        { _id: "uh-1", name: "Energy Research Park Building 2",            budget_m: 260, year: 2027, type: "New Construction", source: "thecb", notes: "Clean energy + carbon capture research, 175K GSF" },
        { _id: "uh-2", name: "Student Housing Village Ph3 (800 beds)",    budget_m: 180, year: 2026, type: "New Construction", source: "thecb", notes: "Graduate + professional student demand" },
        { _id: "uh-3", name: "Cougar Village II Renovation",              budget_m:  60, year: 2027, type: "Renovation",       source: "strategy", notes: "Existing housing systems upgrade" },
        { _id: "uh-4", name: "Fertitta Center Expansion",                 budget_m: 120, year: 2029, type: "Addition",         source: "thecb", notes: "AAC competition + premium seating" },
        { _id: "uh-5", name: "Health Sciences Building Ph2",              budget_m: 195, year: 2028, type: "New Construction", source: "thecb", notes: "College of Medicine + pharmacy colocation" },
        { _id: "uh-6", name: "Fine Arts + Architecture Complex",          budget_m: 130, year: 2030, type: "New Construction", source: "strategy", notes: "Collaborative arts campus, landmark architecture" },
      ],
      gsf: 16_500_000, nasf: 10_200_000, eg_nasf: 2_600_000,
    },

    // ── UH Clear Lake ─────────────────────────────────────────────────────
    {
      name: "UH Clear Lake",
      system: "UH System",
      strategy_priority: 4,
      thecb_total_m: 180,
      lead_practice: "Science + Technology",
      strategy_notes: "NASA/JSC adjacency — aerospace-focused research growth. Space economy hub.",
      contacts: [
        { name: "Dr. Carla Vega", notes: "STEM Dean — aerospace focus, JSC partnership" },
      ],
      projects: [
        { _id: "uhcl-1", name: "STEM & Aerospace Research Building",  budget_m:  95, year: 2028, type: "New Construction", source: "thecb", notes: "NASA partnership, orbital mechanics + robotics labs" },
        { _id: "uhcl-2", name: "Student Services Building Reno",      budget_m:  30, year: 2027, type: "Renovation",       source: "strategy", notes: "Enrollment + advising, student success hub" },
        { _id: "uhcl-3", name: "Bayou Building Addition",             budget_m:  42, year: 2029, type: "Addition",         source: "strategy", notes: "Business + computer science overflow" },
      ],
      gsf: 1_600_000, nasf: 980_000, eg_nasf: null,
    },

    // ── Texas State ───────────────────────────────────────────────────────
    {
      name: "Texas State University",
      system: "Independent",
      strategy_priority: 6,
      thecb_total_m: 460,
      lead_practice: "Student Life",
      strategy_notes: "Fast-growing — enrollment 40K+ and climbing; housing demand acute. San Marcos + Round Rock campuses.",
      contacts: [
        { name: "Maria Gonzalez",  notes: "Facilities Director — San Marcos campus, detail-oriented" },
        { name: "Tom Baber",       notes: "VP Student Affairs — student experience champion" },
      ],
      projects: [
        { _id: "txst-1", name: "Bobcat Stadium Renovation",                 budget_m: 140, year: 2027, type: "Renovation",       source: "strategy", notes: "Sun Belt expansion, south end zone transformation" },
        { _id: "txst-2", name: "Residence Hall — Round Rock (600 beds)",    budget_m: 110, year: 2026, type: "New Construction", source: "thecb", notes: "First housing at Round Rock campus" },
        { _id: "txst-3", name: "Applied Arts Building Replacement",         budget_m:  95, year: 2028, type: "New Construction", source: "thecb", notes: "Aging Sewell Hall replacement, fine arts + media" },
        { _id: "txst-4", name: "Student Recreation Center Expansion",       budget_m:  70, year: 2027, type: "Addition",         source: "strategy", notes: "Aquatics + wellness expansion, capacity pressure" },
        { _id: "txst-5", name: "Science & Engineering Building",            budget_m: 155, year: 2029, type: "New Construction", source: "thecb", notes: "STEM growth, R2 → R1 trajectory" },
      ],
      gsf: 9_800_000, nasf: 6_100_000, eg_nasf: 1_500_000,
    },

    // ── University of North Texas ─────────────────────────────────────────
    {
      name: "University of North Texas",
      system: "UNT System",
      strategy_priority: 5,
      thecb_total_m: 320,
      lead_practice: "Academic",
      strategy_notes: "DFW growth — music/arts college nationally recognized. Discovery Park research campus.",
      contacts: [
        { name: "Dr. Lena Park", notes: "VP Research — Discovery Park champion" },
      ],
      projects: [
        { _id: "unt-1", name: "College of Music New Building",          budget_m: 120, year: 2028, type: "New Construction", source: "thecb", notes: "Recital halls, recording studios, rehearsal spaces" },
        { _id: "unt-2", name: "Hurley Admin Building Renovation",       budget_m:  45, year: 2026, type: "Renovation",       source: "strategy", notes: "Full interior renovation, IT systems" },
        { _id: "unt-3", name: "Mean Green Village Housing Phase 2",     budget_m:  80, year: 2027, type: "New Construction", source: "thecb", notes: "South campus housing, Greek row adjacency" },
        { _id: "unt-4", name: "Discovery Park Research Building 4",     budget_m: 110, year: 2029, type: "New Construction", source: "thecb", notes: "Advanced materials + energy research" },
      ],
      gsf: 8_400_000, nasf: 5_200_000, eg_nasf: null,
    },

    // ── Baylor University ─────────────────────────────────────────────────
    {
      name: "Baylor University",
      system: "Independent",
      strategy_priority: 7,
      thecb_total_m: 540,
      lead_practice: "Health + Wellness",
      strategy_notes: "Private — Baylor Scott & White medical school expansion primary opportunity. R1 earned 2023.",
      contacts: [
        { name: "Dr. Todd Morrison", notes: "VP Research — medical school steering committee, advocate" },
        { name: "Susan Bell",        notes: "Capital Projects — detailed, process-oriented" },
      ],
      projects: [
        { _id: "bay-1", name: "Baylor College of Medicine Waco Ph1",       budget_m: 210, year: 2027, type: "New Construction", source: "strategy", notes: "BSW partnership, 130K GSF, M.D. program" },
        { _id: "bay-2", name: "McLane Stadium North Tower Expansion",       budget_m: 130, year: 2026, type: "Addition",         source: "strategy", notes: "Big 12 premium experience" },
        { _id: "bay-3", name: "Research at the Ridge Building 3",          budget_m:  95, year: 2028, type: "New Construction", source: "thecb", notes: "Life sciences research cluster, R1 buildout" },
        { _id: "bay-4", name: "Student Life Center Renovation",            budget_m:  50, year: 2027, type: "Renovation",       source: "strategy", notes: "Baylor is Bear Foundation - student wellness expansion" },
        { _id: "bay-5", name: "Law School Expansion",                      budget_m:  75, year: 2029, type: "Addition",         source: "strategy", notes: "Moot courtrooms + clinic spaces, ranked program growth" },
      ],
      gsf: 7_200_000, nasf: 4_600_000, eg_nasf: 1_100_000,
    },

    // ── Texas Christian University ────────────────────────────────────────
    {
      name: "Texas Christian University",
      system: "Independent",
      strategy_priority: 5,
      thecb_total_m: 240,
      lead_practice: "Student Life",
      strategy_notes: "Private — campus master plan underway. Strong alumni giving, Big 12 athletics.",
      contacts: [
        { name: "David Chen",     notes: "Facilities Director — prefers in-person meetings" },
      ],
      projects: [
        { _id: "tcu-1", name: "Health, Wellness & Athletics Complex",    budget_m: 150, year: 2028, type: "New Construction", source: "strategy", notes: "Student wellness + ICA integration, west campus" },
        { _id: "tcu-2", name: "Brown-Lupton University Union Reno",      budget_m:  60, year: 2027, type: "Renovation",       source: "strategy", notes: "Student services + dining transformation" },
        { _id: "tcu-3", name: "Neeley School of Business Expansion",     budget_m:  90, year: 2029, type: "Addition",         source: "strategy", notes: "MBA + executive ed growth" },
      ],
      gsf: 5_100_000, nasf: 3_200_000, eg_nasf: null,
    },

    // ── Rice University ───────────────────────────────────────────────────
    {
      name: "Rice University",
      system: "Independent",
      strategy_priority: 6,
      thecb_total_m: 380,
      lead_practice: "Science + Technology",
      strategy_notes: "Private R1 — quantum computing and bioengineering investment cycle. Houston Medical Center adjacency.",
      contacts: [
        { name: "Dr. Cynthia Ruiz", notes: "VP Facilities — former colleague of Jamie K., champion" },
        { name: "Alan Foster",      notes: "Provost Office — research infrastructure focus" },
      ],
      projects: [
        { _id: "rice-1", name: "Quantum Research Center",                budget_m: 180, year: 2027, type: "New Construction", source: "strategy", notes: "NSF Quantum Leap, 80K GSF, dilution refrigerator labs" },
        { _id: "rice-2", name: "Lovett Hall Historic Restoration",       budget_m:  45, year: 2026, type: "Renovation",       source: "strategy", notes: "Registered historic landmark, careful restoration" },
        { _id: "rice-3", name: "BioScience Research Collaborative Ph2",  budget_m: 110, year: 2028, type: "Addition",         source: "thecb", notes: "TMC adjacency, joint research with MD Anderson" },
        { _id: "rice-4", name: "New Graduate Student Housing (400 beds)",budget_m:  85, year: 2029, type: "New Construction", source: "strategy", notes: "Graduate enrollment growth, campus walkability" },
      ],
      gsf: 6_800_000, nasf: 4_300_000, eg_nasf: 1_050_000,
    },

    // ── SMU ───────────────────────────────────────────────────────────────
    {
      name: "Southern Methodist University",
      system: "Independent",
      strategy_priority: 6,
      thecb_total_m: 310,
      lead_practice: "Academic",
      strategy_notes: "Private — Dedman College + Lyle School of Engineering growth. Dallas innovation district adjacency.",
      contacts: [
        { name: "Dr. Pamela Green",  notes: "Provost — Lyle School champion" },
      ],
      projects: [
        { _id: "smu-1", name: "Lyle Engineering Complex Phase 2",        budget_m: 130, year: 2027, type: "Addition",         source: "strategy", notes: "EE + CS + DS expansion, Caruth Hall complement" },
        { _id: "smu-2", name: "Meadows Arts Center Renovation",          budget_m:  55, year: 2028, type: "Renovation",       source: "strategy", notes: "Performance + gallery spaces transformation" },
        { _id: "smu-3", name: "Sustainability + Wellness Hub",           budget_m:  70, year: 2029, type: "New Construction", source: "strategy", notes: "LEED Platinum target, campus living lab" },
      ],
      gsf: 5_400_000, nasf: 3_400_000, eg_nasf: null,
    },

    // ── UT Tyler ──────────────────────────────────────────────────────────
    {
      name: "UT Tyler",
      system: "UT System",
      strategy_priority: 4,
      thecb_total_m: 160,
      lead_practice: "Health + Wellness",
      strategy_notes: "East Texas — new medical school (UT Tyler School of Medicine) is primary opportunity.",
      contacts: [],
      projects: [
        { _id: "utt-1", name: "UT Tyler School of Medicine Building",   budget_m: 110, year: 2027, type: "New Construction", source: "thecb", notes: "Inaugural medical school building, rural health focus" },
        { _id: "utt-2", name: "Nursing Education Center",               budget_m:  45, year: 2026, type: "New Construction", source: "strategy", notes: "BSN + accelerated nursing programs" },
      ],
      gsf: 1_200_000, nasf: 750_000, eg_nasf: null,
    },
  ],
};
