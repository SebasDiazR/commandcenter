import type { RawData } from "./types";


export const GLOSSARY: Record<string, string> = {
  // Funding sources
  "PUF":           "Permanent University Fund. State endowment that funds capital projects at the UT and Texas A&M systems. ~$4.0B of the 2026–2030 pipeline.",
  "TUF":           "Texas University Fund. State endowment for the four emerging research universities (Texas Tech, UNT, University of Houston, Texas State).",
  "HEF":           "Higher Education Fund. State appropriation for capital projects at universities NOT eligible for PUF. ~$0.86B of pipeline.",
  "CCAP":          "Capital Construction Assistance Projects (formerly Tuition Revenue Bonds). State-authorized bonds for specific capital projects, repaid via tuition but historically reimbursed by general revenue. ~$4.3B of pipeline.",
  "Revenue Bonds": "Revenue Financing System Bonds. Repaid from revenue the building generates — housing, student centers, parking, athletics. ~$9.4B of pipeline.",
  "AUF":           "Available University Fund. Investment returns on the PUF; covers debt service and certain operations.",
  "Auxiliary Enterprise Fund": "Proceeds from self-funding operations — parking, food service, bookstores, clinics.",

  // Scoring concepts
  "Priority Score": "0–10 rating set in the 05/19–20/26 strategy session of how much this institution matters for HKS's pipeline. 10 = pour energy here.",
  "Energy Score":  "Priority × log(Pipeline+1) × Urgency × (Relationship÷5) × (0.5+Expansion÷2). Urgency rises the sooner projects are scheduled. Hover any bubble on the Priority Matrix to see the exact factor-by-factor breakdown for that institution.",
  "Urgency":       "Derived from the nearest project start year. Projects starting in 2026 score higher than 2030.",
  "Relationship":  "1–5 star rating of how strong the existing HKS relationship is. Edit inline in the detail panel.",
  "Expansion":     "0–100% probability that winning one project opens the door to follow-on work at the same institution.",

  // Project types (THECB definitions)
  "New Construction":     "Construction of a new building on a site where none existed, or on a demolished site. Additions are tracked separately.",
  "Repair and Renovation":"A portion of a building is renovated — typically gutting and replacing MEP systems and other major components.",
  "Addition":             "Expansion of an existing building's square footage.",
  "Infrastructure":       "Streets, sewers, electrical, steam tunnels, central plants — the physical-plant backbone.",
  "Land Acquisition":     "Purchase of land, with or without structures.",
  "Information Resources":"IT, networks, software, telecommunications.",
  "Leased Space":         "Expenditures to lease space from other entities, typically short-term or program-bridging.",

  // Practice growth
  "HKS Lead Practice":    "Which HKS studio leads the pursuit — Health, Education, Sports, Aviation, Workplace, Civic, Hospitality, Justice.",
  "Outside HKS Portfolio":"Project type where HKS has no current Texas-Higher-Ed reference work but the institution has budget. The growth opportunity.",
  "Verified Pipeline":    "From the THECB Capital Expenditure Plan (FY26–30), filed by institutions in July 2025. Official names, budgets, start dates.",
  "Strategy Note":        "From the 05/19–20/26 internal BD session. Hand-curated context — contacts, hunches, lead practices, unstated opportunities.",
};


export const RAW_DATA: RawData = {
  metadata: {
    title: "Texas Higher Ed BD Command Center",
    sources: [
      "THECB Capital Expenditure Plan Report, FY 2026–2030 (Sept 2025)",
      "Internal BD strategy session, 05/19–20/26"
    ],
    pipeline_total_b: 50.04,
    project_count: 689,
    attendees: ["Ryan Swanson","Andy Albin","Leo Gonzalez","Nate Mead","Catherine Tinkler","Jenifer Wagner","Amanda Adler","Haley Ellis","Enoch Suhm","Jenny Evans","Dan Arrowood"]
  },

  // Funding source totals from THECB Table 1, FY 2026 column
  funding_sources: [
    { name: "Unspecified",                        total_m: 13029.87, pct: 26.0 },
    { name: "Revenue Financing System Bonds",     total_m: 9420.04,  pct: 18.8 },
    { name: "Other Local Funds",                  total_m: 7906.19,  pct: 15.8 },
    { name: "Unknown Funding Source",             total_m: 5121.88,  pct: 10.2 },
    { name: "Capital Construction Assistance (CCAP)", total_m: 4301.40, pct: 8.6 },
    { name: "Permanent University Fund (PUF)",    total_m: 3982.87,  pct: 8.0 },
    { name: "Higher Education Fund Proceeds",     total_m: 859.29,   pct: 1.7 },
    { name: "Gifts / Donations",                  total_m: 788.65,   pct: 1.6 },
    { name: "Auxiliary Enterprise Fund",          total_m: 762.30,   pct: 1.5 },
    { name: "Other",                              total_m: 678.68,   pct: 1.4 },
    { name: "Housing Revenue",                    total_m: 574.47,   pct: 1.1 },
    { name: "General Revenue",                    total_m: 494.09,   pct: 1.0 },
    { name: "Legislative Appropriations",         total_m: 438.24,   pct: 0.9 },
    { name: "Student Fees",                       total_m: 307.23,   pct: 0.6 },
    { name: "Auxiliary Enterprise Revenues",      total_m: 302.26,   pct: 0.6 },
    { name: "Designated Tuition",                 total_m: 298.64,   pct: 0.6 },
    { name: "Other Revenue Bonds",                total_m: 265.91,   pct: 0.5 },
    { name: "Private Development Funds",          total_m: 206.00,   pct: 0.4 },
    { name: "Available University Fund (AUF)",    total_m: 144.80,   pct: 0.3 },
    { name: "Federal Funds",                      total_m: 70.00,    pct: 0.1 },
    { name: "Energy Savings Performance Contract", total_m: 40.00,   pct: 0.1 },
    { name: "Unexpended Plant Funds",             total_m: 35.50,    pct: 0.1 },
    { name: "Federal Grants",                     total_m: 11.70,    pct: 0.0 },
  ],

  // Project type rollups from THECB Graph 2
  project_types: [
    { name: "New Construction",      count: 311, total_b: 33.90, pct: 67.7 },
    { name: "Repair and Renovation", count: 252, total_b: 10.62, pct: 21.2 },
    { name: "Infrastructure",        count: 82,  total_b: 3.08,  pct: 6.1  },
    { name: "Information Resources", count: 6,   total_b: 1.02,  pct: 2.0  },
    { name: "Addition",              count: 17,  total_b: 0.88,  pct: 1.8  },
    { name: "Land Acquisition",      count: 20,  total_b: 0.52,  pct: 1.0  },
    { name: "Leased Space",          count: 1,   total_b: 0.03,  pct: 0.0  },
  ],

  // Expenditures by fiscal year (THECB Graph 3, $M)
  fy_expenditures: [
    { year: "FY2026", total_m: 5021, pct: 10.0 },
    { year: "FY2027", total_m: 8220, pct: 16.4 },
    { year: "FY2028", total_m: 11417, pct: 22.8 },
    { year: "FY2029", total_m: 10966, pct: 21.9 },
    { year: "FY2030", total_m: 7289, pct: 14.6 },
    { year: "Beyond", total_m: 7126, pct: 14.2 },
  ],

  institutions: [
    // ─────────────────────────── NON-SYSTEM ────────────────────────────
    {
      name: "Texas Southern University", system: "Other Public",
      strategy_priority: 2,
      thecb_total_m: 530.32,
      gsf: 311381, nasf: 0, eg_nasf: 0,
      projects: [
        { name: "Football Complex", budget_m: 120, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Thurgood Marshall Law School", budget_m: 120, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Residential & Living Learning Communities", budget_m: 113.5, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Catalyst for Urban Transformation", budget_m: 46, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Health & Wellness Center", budget_m: 35.25, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Nabrit Science Center", budget_m: 22.8, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Campus Wide Electrical & Power Upgrades", budget_m: 15.59, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "Student Recreation Center reno", budget_m: 12, year: 2026, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Texas Woman's University", system: "Other Public",
      strategy_priority: 5,
      thecb_total_m: 368.70,
      gsf: 92000, nasf: 60000, eg_nasf: 26000,
      projects: [
        { name: "Stark Hall", budget_m: 120, year: 2028, type: "Repair and Renovation", source: "thecb", notes: "strategy: target" },
        { name: "Dallas Parking Garage Expansion", budget_m: 65, year: 2028, type: "Repair and Renovation", source: "thecb", notes: "strategy: target" },
        { name: "CFO Classroom & Faculty Office Renov", budget_m: 47.5, year: 2029, type: "Repair and Renovation", source: "thecb", notes: "strategy: target" },
        { name: "MAK Kirk College of Business", budget_m: 45, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Fieldhouse – New Athletics Building", budget_m: 45, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Steam Infrastructure Replacement", budget_m: 12, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "IHSH 8th and 9th Floor Renov", budget_m: 12.5, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Old Main Renovation Phase II", budget_m: 10.5, year: 2029, type: "Repair and Renovation", source: "thecb" },
      ]
    },

    // ───────────────────────── TAMU SYSTEM ─────────────────────────────
    {
      name: "Prairie View A&M", system: "TAMU",
      strategy_priority: 5,
      lead_practice: "Health",
      strategy_notes: "HBCU — strong federal eligibility (CHIPS/IRA). Small pipeline but STEM Research center is real target.",
      thecb_total_m: 71.32,
      gsf: 42747, nasf: 25648, eg_nasf: 25648,
      projects: [
        { name: "Teaching & Academic Student Support Services", budget_m: 45.12, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Fire Alarm System Replacements PH2", budget_m: 12.10, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "SR Collins Renovation", budget_m: 10, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Tarleton State University", system: "TAMU",
      strategy_priority: 8,
      thecb_total_m: 1041.62,
      gsf: 645404, nasf: 451242, eg_nasf: 207647,
      lead_practice: "Mixed",
      strategy_notes: "College of Osteopathic Med — explore co-venture",
      projects: [
        { name: "College of Osteopathic Medicine", budget_m: 125, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: HKS Health lead candidate" },
        { name: "Cain Street Dorm", budget_m: 120, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Lillian Street Dorm", budget_m: 120, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Alumni and Welcome Center", budget_m: 100, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Agricultural Science Building", budget_m: 100, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Fort Worth Residence Hall 1", budget_m: 81, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Fort Worth Academic Building 4", budget_m: 76, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Fort Worth Building #3", budget_m: 75, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Fort Worth Central Plant", budget_m: 50, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Innovation Lab", budget_m: 48, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Parking Structure #2", budget_m: 40, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Ag Farm Tornado Shelter", budget_m: 21.62, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Recreation Center Expansion", budget_m: 20, year: 2029, type: "Addition", source: "thecb" },
        { name: "Dining Services Expansion", budget_m: 15, year: 2029, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "Texas A&M International (Laredo)", system: "TAMU",
      strategy_priority: 6,
      lead_practice: "Health",
      strategy_notes: "Nursing Education & Simulation Center is primary HKS Health target. Border HSI market — underserved healthcare workforce pipeline.",
      thecb_total_m: 288.40,
      gsf: 497988, nasf: 328500, eg_nasf: 78000,
      projects: [
        { name: "Nursing Education & Simulation Center", budget_m: 93.75, year: 2026, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Renov/Expansion Residential Learning Comm", budget_m: 48, year: 2027, type: "Addition", source: "thecb" },
        { name: "Renovation of Kinesiology Convocation", budget_m: 40.25, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Dining Hall & Auxiliary Building", budget_m: 40.25, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Killam Library Renov Ph I/II/III", budget_m: 29.7, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Texas A&M University (College Station)", system: "TAMU",
      strategy_priority: 10,
      thecb_total_m: 1702.92,
      gsf: 1833687, nasf: 1387999, eg_nasf: 614755,
      strategy_notes: "Snohetta on regen master plan? Cyclotron, Vet Vivarium also in play.",
      projects: [
        { name: "Aplin Center", budget_m: 250, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Center for Learning Arts and Innovation", budget_m: 235, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Biology Teaching and Research Building", budget_m: 220, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Mays Business Building #3", budget_m: 192, year: 2026, type: "New Construction", source: "thecb", notes: "strategy: priority target" },
        { name: "West Campus Learning Commons", budget_m: 130, year: 2027, type: "New Construction", source: "thecb" },
        { name: "TAR: Meat Sciences & Technology Center", budget_m: 114.60, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Discovery Drive Parking Garage", budget_m: 103.86, year: 2025, type: "New Construction", source: "thecb" },
        { name: "TEEX: TEEX RELLIS Facilities", budget_m: 85, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Entrepreneurship Building", budget_m: 65, year: 2026, type: "New Construction", source: "thecb" },
        { name: "TAR: Rio Grande Valley Research Center (McAllen)", budget_m: 53.5, year: 2025, type: "New Construction", source: "thecb" },
        { name: "TEEX San Antonio Complex", budget_m: 32.5, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Heep Lab Renovation", budget_m: 30, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Academic Building Exterior Restoration", budget_m: 30, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Texas A&M Galveston", system: "TAMU",
      strategy_priority: 4,
      lead_practice: "Education",
      strategy_notes: "Maritime/simulation niche. Recreation Facility addition and new Student Center conversion are the most accessible entry points.",
      thecb_total_m: 399.28,
      gsf: 147767, nasf: 54710, eg_nasf: 70000,
      projects: [
        { name: "Immersive Simulation & Learning Env. Bldg.", budget_m: 80.25, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Infrastructure, Dock Improv. & Ship FF&E Ph II", budget_m: 77.5, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "Recreation Sports Facility & Athletic Fields", budget_m: 77.19, year: 2028, type: "Addition", source: "thecb" },
        { name: "Campus Resiliency", budget_m: 61.25, year: 2026, type: "Infrastructure", source: "thecb" },
        { name: "Maritime Academy Hall Envelope", budget_m: 35, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Sea Turtle Rehab Hosp. & Ed Center", budget_m: 21, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Land Acquisition", budget_m: 20.68, year: 2025, type: "Land Acquisition", source: "thecb" },
        { name: "Old Library → New Student Center", budget_m: 17.82, year: 2029, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Texas A&M System (RELLIS/HQ)", system: "TAMU",
      strategy_priority: 7,
      lead_practice: "Lab/Sci",
      strategy_notes: "RELLIS is the system's R&D campus — Semiconductor Institute, Law & Ed Building, STEM Center all in play. DoD and aerospace adjacency.",
      thecb_total_m: 852.06,
      gsf: 356308, nasf: 277808, eg_nasf: 225514,
      projects: [
        { name: "Law & Education Building", budget_m: 203.5, year: 2025, type: "New Construction", source: "thecb" },
        { name: "TAMU Semiconductor Institute/Infra/Equip", budget_m: 189, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Ballistic Aero-Optics Range Phase 2", budget_m: 100, year: 2026, type: "Addition", source: "thecb" },
        { name: "TAMUS NVIDIA Supercomputer System", budget_m: 60.20, year: 2025, type: "Information Resources", source: "thecb" },
        { name: "RELLIS STEM Education Center", budget_m: 43.43, year: 2025, type: "New Construction", source: "thecb" },
        { name: "RELLIS Campus Admin Complex & Police", budget_m: 24.89, year: 2027, type: "New Construction", source: "thecb" },
        { name: "RELLIS Blvd Phase I (Kuder to Grissom)", budget_m: 29.26, year: 2026, type: "Infrastructure", source: "thecb" },
        { name: "RELLIS New Water Well", budget_m: 26.68, year: 2029, type: "Infrastructure", source: "thecb" },
        { name: "Easterwood Airport Runway Improvements", budget_m: 25, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "TAMU Health Science Center", system: "TAMU",
      strategy_priority: 7, lead_practice: "Health",
      strategy_notes: "Multi-campus health system (Houston, McAllen, Dallas). Alkek IBT expansion + McAllen nursing/research are near-term wins.",
      thecb_total_m: 253.61,
      gsf: 186500, nasf: 112000, eg_nasf: 92200,
      projects: [
        { name: "Alkek IBT Building Lab Expansion + EnMed", budget_m: 100, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Health Education & Research Building (McAllen)", budget_m: 50, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Nursing Ed & Research Center (McAllen)", budget_m: 47.25, year: 2025, type: "New Construction", source: "thecb" },
        { name: "School of Dentistry Main Renov (Dallas)", budget_m: 22.4, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "TAMU Central Texas", system: "TAMU",
      strategy_priority: 3, thecb_total_m: 141.06,
      strategy_notes: "Fort Hood/Killeen adjacent — student success building and housing. Modest pipeline, watch for follow-on.",
      gsf: 237801, nasf: 159710, eg_nasf: 81500,
      projects: [
        { name: "Student Housing Phase 1", budget_m: 67.03, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Student Success Building", budget_m: 65, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Community Saferoom", budget_m: 9.02, year: 2025, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TAMU Commerce", system: "TAMU",
      strategy_priority: 4, thecb_total_m: 317.32,
      strategy_notes: "DFW metro catchment. Event Center/Arena and new Residence Hall are competitive-facing targets.",
      gsf: 123455, nasf: 68468, eg_nasf: 404,
      projects: [
        { name: "New Event Center / Arena", budget_m: 76.52, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Agricultural Multipurpose Ed & Training Ctr Ph 2", budget_m: 65, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Central Utility Plant", budget_m: 45, year: 2027, type: "New Construction", source: "thecb" },
        { name: "New Residence Hall", budget_m: 40, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Memorial Stadium Renovation", budget_m: 27, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Binnion Hall", budget_m: 24.8, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Rayburn Student Center Expansion", budget_m: 17, year: 2029, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "TAMU Corpus Christi", system: "TAMU",
      strategy_priority: 6, thecb_total_m: 746.74,
      strategy_notes: "Large $747M pipeline. Miramar Housing replacement ($333M) is near-term. Arts & Media Building and Health Center also attractive.",
      gsf: 921366, nasf: 712194, eg_nasf: 215314,
      projects: [
        { name: "Miramar Housing Apartment Replacement", budget_m: 333, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Arts and Media Building", budget_m: 83.89, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Student Success & Classroom Space", budget_m: 65, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Multi Purpose Community Center / Safe Room", budget_m: 55, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Housing Residence Halls Retrofit", budget_m: 41.63, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Parking Garage", budget_m: 40, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Central Plant Chilled/Hot Water Loop", budget_m: 30, year: 2026, type: "Infrastructure", source: "thecb" },
        { name: "Health Center", budget_m: 25.5, year: 2027, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TAMU Kingsville", system: "TAMU",
      strategy_priority: 5, thecb_total_m: 710.00,
      strategy_notes: "South Texas HSI. South Texas A&M Health Hub is the HKS Health target. Large pipeline but spread across ag/rural priorities.",
      gsf: 545554, nasf: 327332, eg_nasf: 170688,
      projects: [
        { name: "Student Commons & Stadium Complex Reno", budget_m: 135, year: 2028, type: "New Construction", source: "thecb" },
        { name: "University Farm Improvements", budget_m: 100, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Science, Technology & Engineering Complex", budget_m: 90, year: 2027, type: "New Construction", source: "thecb" },
        { name: "College of Ag & Natural Resources Academic", budget_m: 90, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Deferred Maintenance", budget_m: 90, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Mesquite Village East", budget_m: 60, year: 2026, type: "New Construction", source: "thecb" },
        { name: "South Texas A&M Health Hub", budget_m: 60, year: 2026, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "South Texas Baffin Bay Research Station", budget_m: 40, year: 2029, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TAMU San Antonio", system: "TAMU",
      strategy_priority: 8, thecb_total_m: 760.59,
      lead_practice: "Health",
      strategy_notes: "Fast-growing campus, $761M pipeline. Biomedical Sciences + Health Sciences Building are marquee HKS Health targets. Academic V and student housing also in play.",
      gsf: 809551, nasf: 534697, eg_nasf: 437852,
      projects: [
        { name: "Academic Building V / Data Center", budget_m: 130, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Student Housing Phase IV", budget_m: 130, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Biomedical Sciences Building", budget_m: 120, year: 2025, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Campus Utility Plant", budget_m: 84.3, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "Health Sciences Building", budget_m: 80, year: 2027, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Student Housing Phase III & Dining", budget_m: 80, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Student Union", budget_m: 60, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Jaguar Dome / Hurricane Safe Room", budget_m: 44.6, year: 2025, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TAMU Texarkana", system: "TAMU",
      strategy_priority: 2, thecb_total_m: 47.90,
      gsf: 72716, nasf: 37975, eg_nasf: 0,
      projects: [
        { name: "Athletics Complex", budget_m: 23, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Storm Shelter / Safe Room", budget_m: 16.40, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Eagle Landing Phase 3", budget_m: 8.5, year: 2026, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "West Texas A&M", system: "TAMU",
      strategy_priority: 5, thecb_total_m: 434.54,
      lead_practice: "Cultural",
      strategy_notes: "Panhandle-Plains Historical Museum renovation ($152M) is a significant Cultural/Civic opportunity. Research Complex also in play.",
      gsf: 227500, nasf: 162500, eg_nasf: 112500,
      projects: [
        { name: "Panhandle-Plains Historical Museum Reno", budget_m: 152, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Multi-Disciplinary Research Complex", budget_m: 77, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Old Main Renovation", budget_m: 65, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Renov of Education Building", budget_m: 44.92, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Learning Commons", budget_m: 21.5, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Multipurpose Tornado Safe Building", budget_m: 13.99, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Cousins Hall Renovation", budget_m: 12.5, year: 2027, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "TAMU Victoria", system: "TAMU",
      strategy_priority: 4, thecb_total_m: 256.00,
      lead_practice: "Aviation",
      strategy_notes: "Aviation building ($69M) is a rare HKS Aviation opportunity in Texas higher ed. Engineering and Agriculture buildings also available.",
      projects: [
        { name: "Academic Engineering Building", budget_m: 91, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Academic Agriculture Building", budget_m: 81.25, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Academic and Research Aviation Building", budget_m: 68.75, year: 2029, type: "New Construction", source: "thecb", notes: "HKS Aviation opportunity" },
        { name: "Land Acquisition – Academic Expansion", budget_m: 15, year: 2026, type: "Land Acquisition", source: "thecb" },
      ]
    },

    // ─────────────────── TEXAS STATE TECHNICAL COLLEGE ──────────────────
    {
      name: "Texas State Technical College System", system: "TSTC",
      strategy_priority: 6, thecb_total_m: 1883.60,
      gsf: 2830694, nasf: 1698718, eg_nasf: 1523780,
      strategy_notes: "30+ projects across Comal/Guadalupe, Denton, Ellis, EWCHEC — workforce-tech building boom.",
      projects: [
        { name: "Ellis Construct Transportation Tech Center", budget_m: 132.49, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Comal/Guadalupe Manufacturing Tech", budget_m: 101.37, year: 2028, type: "New Construction", source: "thecb" },
        { name: "EWCHEC Manufacturing Tech Center", budget_m: 101.37, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Denton Construction Tech Center", budget_m: 89.20, year: 2028, type: "New Construction", source: "thecb" },
        { name: "EWCHEC Construction Tech Center", budget_m: 85.54, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Denton Industrial Tech Center", budget_m: 84.78, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Comal/Guadalupe Transportation Tech", budget_m: 79.14, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Denton Transportation Tech Center", budget_m: 79.14, year: 2028, type: "New Construction", source: "thecb" },
        { name: "EWCHEC Transportation Tech Center", budget_m: 79.14, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Denton Manufacturing Tech Center", budget_m: 80.13, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Ellis Manufacturing Tech Center", budget_m: 71.59, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Comal/Guadalupe Healthcare Tech", budget_m: 68.12, year: 2028, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Ellis Construction Tech Center", budget_m: 67.48, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Multi-campus Admin & Student Service Centers (×4)", budget_m: 266.44, year: 2028, type: "New Construction", source: "thecb" },
        { name: "System Statewide Property Purchases", budget_m: 35, year: 2026, type: "Land Acquisition", source: "thecb" },
      ]
    },
    {
      name: "TSTC Fort Bend", system: "TSTC",
      strategy_priority: 3, thecb_total_m: 77.28,
      gsf: 119088, nasf: 71753, eg_nasf: 60053,
      projects: [
        { name: "Fort Bend CCAP #2", budget_m: 42.16, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Physical Plant", budget_m: 18.15, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Student Recreation Center", budget_m: 10.34, year: 2027, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TSTC Harlingen", system: "TSTC",
      strategy_priority: 3,
      lead_practice: "Aviation",
      strategy_notes: "Aviation Maintenance Building renovation is the HKS Aviation lead.",
      thecb_total_m: 124.16,
      projects: [
        { name: "Renovate Building 200U", budget_m: 19.59, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Campus Recreation Center", budget_m: 19.44, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Aviation Maintenance Building", budget_m: 17.13, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate University Center", budget_m: 16.14, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Site Drainage and Mall Walk Renov", budget_m: 15.12, year: 2028, type: "Infrastructure", source: "thecb" },
      ]
    },
    {
      name: "TSTC Waco", system: "TSTC",
      strategy_priority: 4,
      lead_practice: "Aviation",
      strategy_notes: "Waco Airport Development is HKS Aviation entry point. Transportation Tech Center ($107M) is the largest single target.",
      thecb_total_m: 250.10,
      gsf: 318900, nasf: 198040, eg_nasf: 198040,
      projects: [
        { name: "Transportation Technology Center", budget_m: 107, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Backfill Renovation", budget_m: 41.32, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Renovate Industrial Technology", budget_m: 24, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Campus Book Store and Café", budget_m: 21.66, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Mall Walk and Drainage Renov", budget_m: 18.15, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Waco Airport Development Project", budget_m: 13.75, year: 2026, type: "Infrastructure", source: "thecb", notes: "HKS Aviation opportunity" },
      ]
    },
    {
      name: "TSTC West Texas (Sweetwater/Abilene/Brownwood)", system: "TSTC",
      strategy_priority: 2, thecb_total_m: 130.38,
      projects: [
        { name: "Abilene Renovation Backfill for CCAP", budget_m: 24.86, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Abilene Physical Plant", budget_m: 18.15, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Sweetwater Diesel Expansion", budget_m: 12.5, year: 2029, type: "Addition", source: "thecb" },
        { name: "Sweetwater Student Rec Center", budget_m: 11.60, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Abilene Student Services Building", budget_m: 11.28, year: 2027, type: "New Construction", source: "thecb" },
      ]
    },

    // ───────────────────── TEXAS TECH SYSTEM ───────────────────────────
    {
      name: "Angelo State University", system: "Texas Tech",
      strategy_priority: 4, thecb_total_m: 128.10,
      strategy_notes: "San Angelo — Research & Innovation Hub and indoor athletics complex are the entry points. Modest pipeline.",
      gsf: 80000, nasf: 56000, eg_nasf: 26000,
      projects: [
        { name: "Research and Innovation Hub", budget_m: 61.6, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Massie Hall Renov & Addition", budget_m: 37.02, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Indoor Athletic Competition & Practice", budget_m: 29.48, year: 2028, type: "New Construction", source: "thecb", notes: "HKS Sports opportunity" },
      ]
    },
    {
      name: "Midwestern State University", system: "Texas Tech",
      strategy_priority: 2, thecb_total_m: 73.50,
      strategy_notes: "Wichita Falls — code compliance renovation is the only near-term work. Low near-term HKS opportunity.",
      projects: [
        { name: "Academic Buildings Code Compliance & Infra", budget_m: 67.5, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Parking Facilities", budget_m: 6, year: 2028, type: "Infrastructure", source: "thecb" },
      ]
    },
    {
      name: "Texas Tech University (Lubbock)", system: "Texas Tech",
      strategy_priority: 7, thecb_total_m: 433.00,
      strategy_notes: "Design Village ($115M) is a flagship target for HKS. Music Project and Jones Stadium west facade also in scope.",
      gsf: 305000, nasf: 202850, eg_nasf: 166850,
      projects: [
        { name: "TTU Design Village", budget_m: 115, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Gordon W. Davis Agricultural Building", budget_m: 80, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Jones AT&T Stadium West Facade", budget_m: 60, year: 2026, type: "Repair and Renovation", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "Music Project", budget_m: 50, year: 2027, type: "New Construction", source: "thecb" },
        { name: "NRHC Red Steagall Institute", budget_m: 30, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Doak Hall Renovations", budget_m: 30, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Rawls College of Business South Addition", budget_m: 25, year: 2027, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "TTU Health Sciences Center", system: "Texas Tech",
      strategy_priority: 7, lead_practice: "Health", thecb_total_m: 374.20,
      strategy_notes: "Multi-campus health system (Amarillo, Permian Basin, Abilene, Lubbock). $374M pipeline — Amarillo expansion and Permian Basin clinic are near-term.",
      gsf: 371000, nasf: 259700, eg_nasf: 222600,
      projects: [
        { name: "Amarillo Academic, Research & Clinical Exp", budget_m: 100, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Permian Basin Clinical/Research Expansion", budget_m: 88, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Lubbock Academic Research & Clinical Exp", budget_m: 50, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Abilene Clinical and Research Expansion", budget_m: 40, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Facility Research Lab Modernization Ph 2&3", budget_m: 32, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Preston Smith Library Renov 1st Floor/Atrium", budget_m: 17, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Midland Physicians Asst Remodel", budget_m: 16.2, year: 2025, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "TTU Health Sciences Center – El Paso", system: "Texas Tech",
      strategy_priority: 8, lead_practice: "Health", thecb_total_m: 696.66,
      strategy_notes: "$697M pipeline. Clinical Sciences Building, Dental School, and Cancer Center — three major HKS Health targets at one campus. El Paso underserved healthcare market.",
      gsf: 986551, nasf: 378758, eg_nasf: 323131,
      projects: [
        { name: "Clinical Sciences Building (CCAP)", budget_m: 203.7, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Dental School Building", budget_m: 180, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Cancer Center Building", budget_m: 138.2, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Renov, Repair & Completion of Academy", budget_m: 100, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Warehouse Building Renovation", budget_m: 52.4, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "El Paso Parking Garage #2", budget_m: 50, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Family Medicine Clinic", budget_m: 36.7, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Dept of Public Health Renov", budget_m: 26.85, year: 2025, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Texas Tech System (One Health Research)", system: "Texas Tech",
      strategy_priority: 6,
      lead_practice: "Health",
      strategy_notes: "One Health Research Building ($125M) — system-level research facility bridging human, animal, and environmental health. Strong HKS Lab/Sci fit.",
      thecb_total_m: 125.00,
      projects: [
        { name: "One Health Research Building", budget_m: 125, year: 2027, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
      ]
    },

    // ─────────────────── TEXAS STATE UNIVERSITY SYSTEM ──────────────────
    {
      name: "Lamar Institute of Technology", system: "Texas State",
      strategy_priority: 2, thecb_total_m: 42.00,
      projects: [{ name: "Academic Building", budget_m: 42, year: 2028, type: "New Construction", source: "thecb" }]
    },
    {
      name: "Lamar State College Orange", system: "Texas State",
      strategy_priority: 1, thecb_total_m: 10.00,
      projects: [{ name: "Industrial Training Academy Building", budget_m: 10, year: 2027, type: "New Construction", source: "thecb" }]
    },
    {
      name: "Lamar State College Port Arthur", system: "Texas State",
      strategy_priority: 2, thecb_total_m: 42.00,
      projects: [{ name: "New Academic Building", budget_m: 42, year: 2029, type: "New Construction", source: "thecb" }]
    },
    {
      name: "Lamar University", system: "Texas State",
      strategy_priority: 2, thecb_total_m: 144.75,
      gsf: 115295, nasf: 76865, eg_nasf: 73265,
      strategy_notes: "Most near-term work already allocated.",
      projects: [
        { name: "University Theater Renovation", budget_m: 24.5, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Hayes Biology Building Renovation", budget_m: 24, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Alumni Center", budget_m: 15, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Art Building Renovation", budget_m: 14.85, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Roof Replacements", budget_m: 11.6, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Plummer Building Renovation", budget_m: 7.7, year: 2026, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "Sam Houston State", system: "Texas State",
      strategy_priority: 10, thecb_total_m: 391.47,
      gsf: 583618, nasf: 428289, eg_nasf: 115200,
      strategy_notes: "Top-tier target. Sci & Eng Tech Complex is the marquee.",
      projects: [
        { name: "Science & Engineering Technology Complex", budget_m: 151, year: 2028, type: "New Construction", source: "thecb", notes: "strategy: marquee target — possible partner" },
        { name: "Residence Hall A", budget_m: 86.1, year: 2030, type: "New Construction", source: "thecb" },
        { name: "Interprofessional Education Building", budget_m: 70, year: 2028, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "New University Hotel", budget_m: 35, year: 2026, type: "New Construction", source: "thecb", notes: "HKS Hospitality opportunity" },
        { name: "21st Street Parking Structure", budget_m: 23.7, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Gibbs Ranch Equestrian Facility Ph 2", budget_m: 12.67, year: 2027, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "Texas State University (San Marcos)", system: "Texas State",
      strategy_priority: 10, thecb_total_m: 987.74,
      strategy_notes: "Top-tier. SLC working Music Building.",
      projects: [
        { name: "Hilltop Housing Phase II", budget_m: 251.28, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Chemistry Building", budget_m: 226.8, year: 2028, type: "New Construction", source: "thecb", notes: "strategy: priority target" },
        { name: "Round Rock Multi-Purpose Building", budget_m: 110, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Music Building", budget_m: 90, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: SLC working" },
        { name: "STAR Park Multi-Tenant Building", budget_m: 40, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Aquarena / Charles Austin Garage", budget_m: 32.4, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Renovate Theatre Building", budget_m: 30, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Facilities / Live Oak Parking Garage", budget_m: 29.16, year: 2028, type: "New Construction", source: "thecb" },
        { name: "ALERRT Center Improvements", budget_m: 25, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Athletic Practice Facility", budget_m: 25, year: 2025, type: "New Construction", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "STEM Ingram Parking Garage", budget_m: 21.6, year: 2026, type: "New Construction", source: "thecb" },
      ]
    },

    // ───────────────────────── UNT SYSTEM ──────────────────────────────
    {
      name: "University of North Texas (Denton)", system: "UNT",
      strategy_priority: 5, thecb_total_m: 730.80,
      gsf: 558278, nasf: 378951, eg_nasf: 148176,
      projects: [
        { name: "UNT Residence Hall", budget_m: 176, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Commerce, Analytics, Tech & Engineering (CATE)", budget_m: 130, year: 2028, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Recreational Sports Fields", budget_m: 75, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Pohl Recreational Center Phase 3", budget_m: 43, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Central Utility Plant", budget_m: 35, year: 2027, type: "Infrastructure", source: "thecb" },
        { name: "Coliseum MEP", budget_m: 33, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "New Student Innovation Center", budget_m: 30, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Pohl Recreational Center Phase 4", budget_m: 30, year: 2029, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "UNT Dallas", system: "UNT",
      strategy_priority: 6, thecb_total_m: 367.50,
      strategy_notes: "Urban campus, $368M pipeline. Business Technology Building, Event Center, and Sports Fields are all buildable HKS targets.",
      gsf: 651480, nasf: 167000, eg_nasf: 72000,
      projects: [
        { name: "Business Technology Building", budget_m: 120, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Event Center", budget_m: 120, year: 2029, type: "New Construction", source: "thecb" },
        { name: "UNTD Sports Fields", budget_m: 87.5, year: 2028, type: "New Construction", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "Second Residence Hall / Dining", budget_m: 40, year: 2028, type: "New Construction", source: "thecb" },
      ]
    },

    // ─────────────────────── UT SYSTEM ──────────────────────────────────
    {
      name: "Stephen F. Austin", system: "UT",
      strategy_priority: 6,
      strategy_notes: "Now part of UT System.",
      thecb_total_m: 980.67,
      gsf: 176075, nasf: 91907, eg_nasf: 90538,
      projects: [
        { name: "Replacement of Miller Science", budget_m: 150, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Homer Bryce Stadium Upgrades", budget_m: 130, year: 2028, type: "Repair and Renovation", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "New Ag Complex", budget_m: 75, year: 2028, type: "New Construction", source: "thecb" },
        { name: "New Residence Hall", budget_m: 60, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Steen Library Renovations", budget_m: 50, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "McKibben Reno for School of Nursing", budget_m: 50, year: 2029, type: "Repair and Renovation", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Baseball/Softball Complex", budget_m: 40, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Replacement of Kennedy Auditorium", budget_m: 35, year: 2027, type: "New Construction", source: "thecb" },
        { name: "New Entrepreneurship Center", budget_m: 40, year: 2025, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "UT Arlington", system: "UT",
      strategy_priority: 10, thecb_total_m: 791.23,
      gsf: 865064, nasf: 421951, eg_nasf: 400180,
      projects: [
        { name: "University Center Addition/Renovation", budget_m: 175, year: 2025, type: "Addition", source: "thecb" },
        { name: "UTA West Building A", budget_m: 161, year: 2026, type: "New Construction", source: "thecb" },
        { name: "E&G Facility Renewal", budget_m: 137, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Fine Arts Renovation", budget_m: 113.4, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Performing Arts Center", budget_m: 89.78, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Thermal Energy Satellite Plant", budget_m: 85.05, year: 2027, type: "New Construction", source: "thecb" },
        { name: "UTA West Infrastructure Improvements", budget_m: 19, year: 2026, type: "Infrastructure", source: "thecb" },
        { name: "Central Library Mall Landscape", budget_m: 10, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Hotel Conference Center (P3)", budget_m: null, year: 2027, type: "New Construction", source: "thecb", notes: "TBD budget" },
        { name: "Research/Office Building & Parking (P3)", budget_m: null, year: 2027, type: "New Construction", source: "thecb", notes: "TBD budget" },
        { name: "Student Services One-Stop & Welcome (P3)", budget_m: null, year: 2028, type: "New Construction", source: "thecb", notes: "TBD budget" },
      ]
    },
    {
      name: "UT Austin", system: "UT",
      strategy_priority: 10,
      thecb_total_m: 9398.56,
      gsf: 1713000, nasf: 0, eg_nasf: 0,
      strategy_notes: "Largest UT pipeline by far — MCP, Bluebonnet Hill, I35 Cap.",
      contacts: [
        { name: "Allison ?", notes: "TBD role" },
        { name: "Travis Laird", notes: "Cleveland Clinic background" },
        { name: "Brent Stringfellow", notes: "Education" },
        { name: "Carrie West", notes: "Education" }
      ],
      projects: [
        { name: "MCP: Construct UT Medical Complex", budget_m: 2000, year: 2026, type: "New Construction", source: "thecb", notes: "HKS Health flagship" },
        { name: "NEW: Construct Bluebonnet Hill", budget_m: 1360, year: 2026, type: "New Construction", source: "thecb" },
        { name: "PMA: Sciences and Research Complex", budget_m: 810, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "ARC Replacement", budget_m: 810, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "MCP Enabling: UTL and Infrastructure", budget_m: 600, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "PAT Full Renovation", budget_m: 450, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "ET Student & Financial Sys Transformation", budget_m: 318, year: 2025, type: "Information Resources", source: "thecb" },
        { name: "I35 Cap: Masterplan and Cap", budget_m: 156, year: 2026, type: "New Construction", source: "thecb" },
        { name: "UTC: Renovate Building", budget_m: 149.15, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "GSH II: Graduate Student Housing Ph II", budget_m: 142.5, year: 2026, type: "New Construction", source: "thecb" },
        { name: "CMB: Renov Complex to Advance Creative AI", budget_m: 130.81, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "CBA/GSB: Renovate Space", budget_m: 130, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "ET Equipment Lifecycle & Remediation", budget_m: 131, year: 2025, type: "Information Resources", source: "thecb" },
        { name: "Law School Village", budget_m: 105, year: 2025, type: "New Construction", source: "thecb" },
        { name: "BIO: Biological Labs Renov", budget_m: 100, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Symphony Square Acquisition & Build-out", budget_m: 86, year: 2025, type: "Land Acquisition", source: "thecb" },
      ]
    },
    {
      name: "UT Dallas", system: "UT",
      strategy_priority: 10, thecb_total_m: 1923.75,
      gsf: 3265052, nasf: 1239783, eg_nasf: 750800,
      projects: [
        { name: "Student Success Center | Student Union", budget_m: 292.5, year: 2023, type: "New Construction", source: "thecb" },
        { name: "Multidisciplinary Science & Technology Building", budget_m: 240, year: 2026, type: "New Construction", source: "thecb", notes: "strategy: Payette? Ballinger?" },
        { name: "Event Center", budget_m: 220, year: 2026, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Student Housing VIII", budget_m: 201, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Behavioral and Brain Sciences", budget_m: 175, year: 2028, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Student Housing IX", budget_m: 145, year: 2029, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "School of Management Expansion III", budget_m: 98, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Arts & Performance Complex Ph 2", budget_m: 93.75, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Parking Structure II – Housing", budget_m: 83.5, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Parking Structure VI", budget_m: 83.5, year: 2030, type: "New Construction", source: "thecb" },
        { name: "Replacement of Hoblitzelle Hall", budget_m: 60, year: 2030, type: "New Construction", source: "thecb" },
        { name: "Parking Structure V / APC", budget_m: 59, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Callier Center South Renewal", budget_m: 40, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Research Op Center West – II", budget_m: 28, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
      ]
    },
    {
      name: "UT El Paso", system: "UT",
      strategy_priority: 6, thecb_total_m: 569.03,
      strategy_notes: "HSI flagship — $569M pipeline. Texas Western Hall, Student Success Building, and Student Housing are near-term. DoD/Fort Bliss adjacency.",
      gsf: 647205, nasf: 364797, eg_nasf: 133467,
      projects: [
        { name: "Texas Western Hall", budget_m: 109.52, year: 2023, type: "New Construction", source: "thecb" },
        { name: "Renov, Repair & Completion of Existing Academy", budget_m: 100, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Advanced Manufacturing & Aerospace Center", budget_m: 80, year: 2023, type: "New Construction", source: "thecb" },
        { name: "Union West Renovation", budget_m: 70, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Student Success Building", budget_m: 64.5, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Student Housing", budget_m: 62.7, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Parking Garage", budget_m: 37.31, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Property Acquisition", budget_m: 20, year: 2025, type: "Land Acquisition", source: "thecb" },
      ]
    },
    {
      name: "UT San Antonio (UTSA)", system: "UT",
      strategy_priority: 10, thecb_total_m: 2957.97,
      gsf: 3945210, nasf: 1159305, eg_nasf: 356250,
      strategy_notes: "Massive $3B pipeline. ITC museum, Cattleman's Square Hall, downtown buildout.",
      projects: [
        { name: "Creative Arts Education & Engagement Bldg", budget_m: 271.30, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Interdisciplinary Research Complex", budget_m: 224.21, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Fine Arts Living & Learning Building", budget_m: 200, year: 2030, type: "New Construction", source: "thecb" },
        { name: "Deferred Maintenance", budget_m: 175, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Main Campus Adaptive Reuse", budget_m: 165, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Peter T. Flawn Bldg Renov & Adaptive Reuse", budget_m: 157.56, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Cattleman's Square Residence Hall", budget_m: 157.5, year: 2030, type: "New Construction", source: "thecb" },
        { name: "Student Success Center", budget_m: 156.8, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Multidisciplinary Partnership Building", budget_m: 142.5, year: 2030, type: "New Construction", source: "thecb" },
        { name: "San Pedro III", budget_m: 136, year: 2026, type: "New Construction", source: "thecb" },
        { name: "McKinney Humanities Capital Renewal", budget_m: 117.56, year: 2030, type: "Repair and Renovation", source: "thecb" },
        { name: "Roadrunner Village", budget_m: 110, year: 2028, type: "New Construction", source: "thecb" },
        { name: "ITC Museum", budget_m: 110, year: 2029, type: "New Construction", source: "thecb", notes: "HKS Cultural opportunity" },
        { name: "Arena-Convocation Center", budget_m: 108, year: 2029, type: "New Construction", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "Honors Residential College Phase III", budget_m: 89.51, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Residence Hall Phase II", budget_m: 80.67, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Library and Student Collaboration Center", budget_m: 75, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Athletics Complex Baseball/Softball", budget_m: 63.75, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Main Campus SW Thermal Energy Plant", budget_m: 50, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Garage #4", budget_m: 46.20, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Infrastructure Rehab & Renovation", budget_m: 50, year: 2027, type: "Infrastructure", source: "thecb" },
        { name: "Energy Efficiency System Renewals", budget_m: 40, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Downtown Adaptive Reuse Renovations", budget_m: 30, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Phased University Downtown Procurement", budget_m: 30, year: 2027, type: "Land Acquisition", source: "thecb" },
        { name: "ROTC Band Hall Annex & Practice Field", budget_m: 24, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Phase 4 Classroom Renovations", budget_m: 21.48, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "ITC Libraries Archival Facilities", budget_m: 21, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Future Museum Asset Acquisition", budget_m: 20, year: 2027, type: "Land Acquisition", source: "thecb" },
      ]
    },
    {
      name: "UT Tyler (incl HSC)", system: "UT",
      strategy_priority: 2, thecb_total_m: 799.91,
      gsf: 415666, nasf: 303425, eg_nasf: 11700,
      projects: [
        { name: "Campus Village Residence Housing", budget_m: 325, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Campus Renovations Phase 2", budget_m: 125, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Ornelas Hall Addition & Renovation", budget_m: 84.30, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Facility Renovation and Modernization (HSC)", budget_m: 59.92, year: 2028, type: "Repair and Renovation", source: "thecb" },
        { name: "Stewart Hall Renovation", budget_m: 48.57, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Campus Vehicular Improvements", budget_m: 30.07, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Campus Renovations Phase 1", budget_m: 25, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Student Services at COB", budget_m: 22.64, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Psychiatric Inpatient & Outpatient Expansion", budget_m: 19, year: 2026, type: "Repair and Renovation", source: "thecb", notes: "HKS Health opportunity" },
      ]
    },
    {
      name: "UT Health Houston", system: "UT", lead_practice: "Health",
      strategy_priority: 9, thecb_total_m: 2528.99,
      gsf: 2810000, nasf: 252000, eg_nasf: 552000,
      strategy_notes: "HKS Health lead — $1.5B Multi Specialty Hospital is the largest project in the THECB report.",
      projects: [
        { name: "Multi Specialty Hospital", budget_m: 1537.5, year: 2028, type: "New Construction", source: "thecb", notes: "HKS Health flagship — largest project in report" },
        { name: "New Professional Building", budget_m: 300, year: 2028, type: "New Construction", source: "thecb" },
        { name: "MSB Research Expansion Phase II", budget_m: 250, year: 2027, type: "New Construction", source: "thecb" },
        { name: "RAS Repurpose", budget_m: 115, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "New School of Behavioral Sciences", budget_m: 93.5, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Sugarland Multi-Specialty Clinic", budget_m: 75, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Digital Innovation Tower", budget_m: 72, year: 2029, type: "New Construction", source: "thecb" },
        { name: "Bellaire Station Renovation", budget_m: 27.48, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Expanded Parking", budget_m: 24, year: 2026, type: "New Construction", source: "thecb" },
        { name: "UCT Repurpose/Modernization", budget_m: 19.6, year: 2026, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "UT Health San Antonio", system: "UT", lead_practice: "Health",
      strategy_priority: 9, thecb_total_m: 951.40,
      gsf: 998069, nasf: 590991, eg_nasf: 92900,
      projects: [
        { name: "Research Expansion Facility (Science Two)", budget_m: 300, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Clinical Expansion Projects", budget_m: 200, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Campus Renewal and Maintenance (FY26-30)", budget_m: 110, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Science One Research Building", budget_m: 100, year: 2024, type: "New Construction", source: "thecb" },
        { name: "Center For Brain Health Building", budget_m: 99.90, year: 2023, type: "New Construction", source: "thecb" },
        { name: "Renovation of Research Space Phase Two", budget_m: 40, year: 2023, type: "Repair and Renovation", source: "thecb" },
        { name: "2nd Hospital Garage", budget_m: 33.8, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Renovation of Research Space Phase Three", budget_m: 25, year: 2027, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "UT MD Anderson", system: "UT", lead_practice: "Health",
      strategy_priority: 10, thecb_total_m: 6783.32,
      gsf: 4505000, nasf: 2874000, eg_nasf: 0,
      strategy_notes: "Second-largest pipeline at $6.78B. Patient Care + Austin Medical Complex each $2.5B.",
      projects: [
        { name: "1 Patient Care", budget_m: 2500, year: 2026, type: "New Construction", source: "thecb", notes: "HKS Health flagship" },
        { name: "Austin Medical Complex Project", budget_m: 2500, year: 2020, type: "New Construction", source: "thecb", notes: "HKS Health flagship" },
        { name: "Radiology Outpatient Center Replacement", budget_m: 213, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Jones Bates-Freeman AC Demo", budget_m: 188.49, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Pressler Street Garage 2", budget_m: 145, year: 2026, type: "New Construction", source: "thecb" },
        { name: "CRR Renovation Budget", budget_m: 122.81, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "Proton Therapy Center 1 – Equipment Replace", budget_m: 124.7, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Permian Basin", budget_m: 110, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Clinics of the Future", budget_m: 90.8, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Clark Clinics Facility Renewal", budget_m: 73.3, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "6624 Fannin Lease", budget_m: 62, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Information Technology Projects", budget_m: 373.37, year: 2025, type: "Information Resources", source: "thecb" },
        { name: "Land Acquisitions (1, 2, 3)", budget_m: 92, year: 2025, type: "Land Acquisition", source: "thecb" },
        { name: "Expansion – Woodlands", budget_m: 20, year: 2026, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "UT Medical Branch Galveston", system: "UT", lead_practice: "Health",
      strategy_priority: 9, thecb_total_m: 1497.99,
      gsf: 658386, nasf: 434549, eg_nasf: 60350,
      projects: [
        { name: "Construct New Research Building 1", budget_m: 510, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Institutional Infrastructure Refresh & Renewal", budget_m: 421.02, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "League City Campus Phase 3 Expansion", budget_m: 150, year: 2026, type: "Addition", source: "thecb" },
        { name: "Information Technology Investments", budget_m: 127.68, year: 2025, type: "Information Resources", source: "thecb" },
        { name: "Student Housing", budget_m: 85, year: 2025, type: "New Construction", source: "thecb" },
        { name: "East Plant Chiller Build-Out & Utility Loop", budget_m: 54.94, year: 2025, type: "Infrastructure", source: "thecb" },
        { name: "School of Medicine Renovation", budget_m: 50, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Texas Medical Center Research & Innovation (lease)", budget_m: 25, year: 2025, type: "Leased Space", source: "thecb" },
        { name: "Clear Lake Multispecialty Clinic", budget_m: 23, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Angleton MOB", budget_m: 20, year: 2027, type: "New Construction", source: "thecb" },
      ]
    },
    {
      name: "UT Southwestern Medical Center", system: "UT", lead_practice: "Health",
      strategy_priority: 9, thecb_total_m: 934.63,
      gsf: 258000, nasf: 167700, eg_nasf: 102700,
      projects: [
        { name: "Deferred Maintenance & Resiliency Projects", budget_m: 340, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "SOPH & SHP Academic Center", budget_m: 290, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Fort Worth Medical Center", budget_m: 106.93, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Health System IP or OP Expansion TBD", budget_m: 89.7, year: 2026, type: "Repair and Renovation", source: "thecb" },
        { name: "Purchase Area Parcels", budget_m: 75, year: 2025, type: "Land Acquisition", source: "thecb" },
        { name: "Salvation Army Property Purchase", budget_m: 24, year: 2026, type: "Land Acquisition", source: "thecb" },
        { name: "Cancer Center Outpatient Shell Buildout", budget_m: 9, year: 2026, type: "Repair and Renovation", source: "thecb" },
      ]
    },
    {
      name: "UT Rio Grande Valley", system: "UT",
      strategy_priority: 2, thecb_total_m: 1347.64,
      projects: [
        { name: "New Hospital", budget_m: 550, year: 2027, type: "New Construction", source: "thecb", notes: "HKS Health opportunity" },
        { name: "New Research with Vivarium Building", budget_m: 160, year: 2025, type: "Addition", source: "thecb" },
        { name: "Brw Engineering Building & Chilled Water Plant", budget_m: 150, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Medical Office Building (McAllen)", budget_m: 70, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Student Dining", budget_m: 62, year: 2026, type: "New Construction", source: "thecb" },
        { name: "Majestic Theater", budget_m: 60, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Student Housing", budget_m: 50, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Physical/Occupational Therapy Remodel", budget_m: 42.3, year: 2025, type: "Repair and Renovation", source: "thecb", notes: "HKS Health opportunity" },
        { name: "Optometry Remodel", budget_m: 41.3, year: 2025, type: "Repair and Renovation", source: "thecb" },
        { name: "Edinburg Railway Safety Lab", budget_m: 15, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Property: 1400 E Nolana (10 ac)", budget_m: 12.1, year: 2025, type: "Land Acquisition", source: "thecb" },
        { name: "New Gym at Brownsville Area", budget_m: 11, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Brownsville Machine Shop", budget_m: 10, year: 2025, type: "New Construction", source: "thecb" },
      ]
    },

    // ───────────────────── UH SYSTEM ───────────────────────────────────
    {
      name: "University of Houston", system: "UH",
      strategy_priority: 10, thecb_total_m: 1553.93,
      gsf: 895924, nasf: 578910, eg_nasf: 243660,
      strategy_notes: "Top-tier. Biotech, AI center, Moody Tower all in pipeline.",
      projects: [
        { name: "Advanced Biotechnology & Biomanufacturing", budget_m: 210, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target — HKS Health/Lab" },
        { name: "Research Support Satellite Plant", budget_m: 200, year: 2027, type: "Infrastructure", source: "thecb" },
        { name: "New Moody Towers Residence Hall Replacement", budget_m: 200, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Center for Innov in Adv Mfg & AI", budget_m: 168, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "New Freshman Housing", budget_m: 167, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Law Complex Renovation", budget_m: 115.48, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Research Infrastructure Phase 1", budget_m: 100, year: 2027, type: "Infrastructure", source: "thecb" },
        { name: "E. Cullen Renovation", budget_m: 79, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Science and Research 2", budget_m: 73.78, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Campus Life Safety Building", budget_m: 68.75, year: 2027, type: "New Construction", source: "thecb" },
        { name: "Renovate Lamar Fleming Jr.", budget_m: 67.7, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Renovate Fred J. Heyne Building", budget_m: 40.63, year: 2029, type: "Repair and Renovation", source: "thecb" },
        { name: "Agrawal Level 2 and 4 Buildout", budget_m: 35, year: 2025, type: "New Construction", source: "thecb" },
        { name: "Student Center Addition", budget_m: 28.6, year: 2024, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "UH System (Katy/Sugar Land)", system: "UH",
      strategy_priority: 9, thecb_total_m: 315.50,
      gsf: 230000, nasf: 157000, eg_nasf: 157000,
      projects: [
        { name: "Katy Academic Building #2", budget_m: 187.5, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Sugar Land Acad, Nursing Bldg & Utility Plant", budget_m: 128, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target — HKS Health" },
      ]
    },
    {
      name: "UH Clear Lake", system: "UH",
      strategy_priority: 9, thecb_total_m: 261.66,
      gsf: 250535, nasf: 135035, eg_nasf: 87535,
      projects: [
        { name: "STEM and Classroom Building Phase II", budget_m: 112, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Campus Center / Student Center", budget_m: 64.8, year: 2027, type: "New Construction", source: "thecb", notes: "strategy: target" },
        { name: "Renovate Delta, STEM vacated Phase II", budget_m: 36.16, year: 2027, type: "Repair and Renovation", source: "thecb" },
        { name: "Complete STEM I and HSCB space", budget_m: 17.2, year: 2028, type: "Addition", source: "thecb" },
        { name: "Replace Environmental Institute of Houston", budget_m: 10.5, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Additional Parking", budget_m: 10, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Campus Mall with Bioswale", budget_m: 7, year: 2027, type: "Infrastructure", source: "thecb" },
        { name: "Central Plant Expansion", budget_m: 4, year: 2027, type: "Addition", source: "thecb" },
      ]
    },
    {
      name: "UH Downtown", system: "UH",
      strategy_priority: 6, thecb_total_m: 378.40,
      strategy_notes: "Urban campus on the bayou. Convocation Center/Arena ($101M) is the HKS Sports entry point. Housing + Union + Police facility also in play.",
      gsf: 393378, nasf: 19500, eg_nasf: 19500,
      projects: [
        { name: "Student Housing, Student Union, Parking", budget_m: 121, year: 2028, type: "New Construction", source: "thecb" },
        { name: "Convocation Center / Multi Purpose Arena", budget_m: 101, year: 2027, type: "New Construction", source: "thecb", notes: "HKS Sports opportunity" },
        { name: "Police & Emergency Operation Center", budget_m: 65, year: 2027, type: "New Construction", source: "thecb", notes: "HKS Civic/Justice opportunity" },
        { name: "Property Acquisition", budget_m: 45, year: 2027, type: "Land Acquisition", source: "thecb" },
        { name: "One Main Building Renovations", budget_m: 37, year: 2026, type: "Repair and Renovation", source: "thecb" },
      ]
    },

    // ─────────────────── COMMUNITY / PRIVATE (strategy-only) ────────────
    {
      name: "Alamo College", system: "Community", strategy_priority: 10,
      strategy_notes: "Strategy session top-tier target. No THECB filing (community colleges fund locally).",
      thecb_total_m: 0, projects: []
    },
    {
      name: "Austin Community College", system: "Community", strategy_priority: 7,
      thecb_total_m: 0, projects: []
    },
    {
      name: "Collin College", system: "Community", strategy_priority: 7,
      thecb_total_m: 0, projects: []
    },
    {
      name: "San Jacinto College", system: "Community", strategy_priority: 7,
      thecb_total_m: 0, projects: []
    },
    {
      name: "Lone Star College", system: "Community", strategy_priority: 0,
      thecb_total_m: 0, projects: []
    },
    {
      name: "TCU", system: "Private", strategy_priority: null,
      strategy_notes: "Connect through HKS Sports.",
      thecb_total_m: 0, projects: []
    },
    {
      name: "Baylor", system: "Private", strategy_priority: 8,
      thecb_total_m: 0, projects: []
    },
  ],
};

