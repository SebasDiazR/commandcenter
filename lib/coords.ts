export interface InstCoords {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export const INST_COORDS: Record<string, InstCoords> = {
  // ── Other Public ─────────────────────────────────────────────────────────────
  "Texas Southern University":              { lat: 29.7202, lng: -95.3543, city: "Houston",          state: "TX" },
  "Texas Woman's University":              { lat: 33.2148, lng: -97.1331, city: "Denton",           state: "TX" },

  // ── TAMU System ──────────────────────────────────────────────────────────────
  "Prairie View A&M":                      { lat: 30.0910, lng: -95.9813, city: "Prairie View",     state: "TX" },
  "Tarleton State University":             { lat: 32.2337, lng: -98.2024, city: "Stephenville",     state: "TX" },
  "Texas A&M International (Laredo)":      { lat: 27.5612, lng: -99.4920, city: "Laredo",           state: "TX" },
  "Texas A&M University (College Station)":{ lat: 30.6187, lng: -96.3365, city: "College Station",  state: "TX" },
  "Texas A&M Galveston":                   { lat: 29.3013, lng: -94.7977, city: "Galveston",        state: "TX" },
  "Texas A&M System (RELLIS/HQ)":         { lat: 30.6680, lng: -96.3604, city: "Bryan",            state: "TX" },
  "TAMU Health Science Center":            { lat: 30.6271, lng: -96.3344, city: "Bryan",            state: "TX" },
  "TAMU Central Texas":                    { lat: 31.1171, lng: -97.7278, city: "Killeen",          state: "TX" },
  "TAMU Commerce":                         { lat: 33.2476, lng: -95.9038, city: "Commerce",         state: "TX" },
  "TAMU Corpus Christi":                   { lat: 27.7143, lng: -97.3244, city: "Corpus Christi",   state: "TX" },
  "TAMU Kingsville":                       { lat: 27.5156, lng: -97.8556, city: "Kingsville",       state: "TX" },
  "TAMU San Antonio":                      { lat: 29.4241, lng: -98.4936, city: "San Antonio",      state: "TX" },
  "TAMU Texarkana":                        { lat: 33.4418, lng: -94.0477, city: "Texarkana",        state: "TX" },
  "West Texas A&M":                        { lat: 34.9820, lng: -101.9213, city: "Canyon",          state: "TX" },
  "TAMU Victoria":                         { lat: 28.8053, lng: -97.0036, city: "Victoria",         state: "TX" },

  // ── TSTC System ──────────────────────────────────────────────────────────────
  "Texas State Technical College System":  { lat: 31.5493, lng: -97.1467, city: "Waco",            state: "TX" },
  "TSTC Fort Bend":                        { lat: 29.5455, lng: -95.8083, city: "Rosenberg",        state: "TX" },
  "TSTC Harlingen":                        { lat: 26.1906, lng: -97.6961, city: "Harlingen",        state: "TX" },
  "TSTC Waco":                             { lat: 31.5493, lng: -97.1467, city: "Waco",            state: "TX" },
  "TSTC West Texas (Sweetwater/Abilene/Brownwood)": { lat: 32.4712, lng: -100.4059, city: "Sweetwater", state: "TX" },

  // ── Texas Tech System ────────────────────────────────────────────────────────
  "Angelo State University":               { lat: 31.4338, lng: -100.4564, city: "San Angelo",      state: "TX" },
  "Midwestern State University":           { lat: 33.9137, lng: -98.4934, city: "Wichita Falls",    state: "TX" },
  "Texas Tech University (Lubbock)":       { lat: 33.5843, lng: -101.8827, city: "Lubbock",         state: "TX" },
  "TTU Health Sciences Center":            { lat: 33.5779, lng: -101.8552, city: "Lubbock",         state: "TX" },
  "TTU Health Sciences Center – El Paso":  { lat: 31.7620, lng: -106.4850, city: "El Paso",         state: "TX" },
  "Texas Tech System (One Health Research)":{ lat: 33.5843, lng: -101.8827, city: "Lubbock",        state: "TX" },

  // ── Texas State System ───────────────────────────────────────────────────────
  "Lamar Institute of Technology":         { lat: 30.0860, lng: -94.1015, city: "Beaumont",         state: "TX" },
  "Lamar State College Orange":            { lat: 30.0932, lng: -93.7337, city: "Orange",           state: "TX" },
  "Lamar State College Port Arthur":       { lat: 29.8850, lng: -93.9399, city: "Port Arthur",      state: "TX" },
  "Lamar University":                      { lat: 30.0793, lng: -94.1330, city: "Beaumont",         state: "TX" },
  "Sam Houston State":                     { lat: 30.7085, lng: -95.5500, city: "Huntsville",       state: "TX" },
  "Texas State University (San Marcos)":   { lat: 29.8883, lng: -97.9414, city: "San Marcos",       state: "TX" },

  // ── UNT System ───────────────────────────────────────────────────────────────
  "University of North Texas (Denton)":    { lat: 33.2087, lng: -97.1467, city: "Denton",           state: "TX" },
  "UNT Dallas":                            { lat: 32.7503, lng: -96.7767, city: "Dallas",           state: "TX" },

  // ── UT System ────────────────────────────────────────────────────────────────
  "Stephen F. Austin":                     { lat: 31.6035, lng: -94.6557, city: "Nacogdoches",      state: "TX" },
  "UT Arlington":                          { lat: 32.7297, lng: -97.1135, city: "Arlington",        state: "TX" },
  "UT Austin":                             { lat: 30.2849, lng: -97.7341, city: "Austin",           state: "TX" },
  "UT Dallas":                             { lat: 32.9886, lng: -96.7479, city: "Richardson",       state: "TX" },
  "UT El Paso":                            { lat: 31.7720, lng: -106.5010, city: "El Paso",         state: "TX" },
  "UT San Antonio (UTSA)":                 { lat: 29.5743, lng: -98.6194, city: "San Antonio",      state: "TX" },
  "UT Tyler (incl HSC)":                   { lat: 32.3194, lng: -95.3012, city: "Tyler",            state: "TX" },
  "UT Health Houston":                     { lat: 29.7089, lng: -95.3974, city: "Houston",          state: "TX" },
  "UT Health San Antonio":                 { lat: 29.5096, lng: -98.5713, city: "San Antonio",      state: "TX" },
  "UT MD Anderson":                        { lat: 29.7063, lng: -95.3972, city: "Houston",          state: "TX" },
  "UT Medical Branch Galveston":           { lat: 29.3102, lng: -94.7742, city: "Galveston",        state: "TX" },
  "UT Southwestern Medical Center":        { lat: 32.8120, lng: -96.8394, city: "Dallas",           state: "TX" },
  "UT Rio Grande Valley":                  { lat: 26.3017, lng: -98.1633, city: "Edinburg",         state: "TX" },

  // ── UH System ────────────────────────────────────────────────────────────────
  "University of Houston":                 { lat: 29.7199, lng: -95.3422, city: "Houston",          state: "TX" },
  "UH System (Katy/Sugar Land)":           { lat: 29.6197, lng: -95.6349, city: "Sugar Land",       state: "TX" },
  "UH Clear Lake":                         { lat: 29.5734, lng: -95.1200, city: "Houston",          state: "TX" },
  "UH Downtown":                           { lat: 29.7563, lng: -95.3635, city: "Houston",          state: "TX" },

  // ── Community Colleges ───────────────────────────────────────────────────────
  "Alamo College":                         { lat: 29.4241, lng: -98.4936, city: "San Antonio",      state: "TX" },
  "Austin Community College":              { lat: 30.2849, lng: -97.7341, city: "Austin",           state: "TX" },
  "Collin College":                        { lat: 33.1972, lng: -96.6397, city: "McKinney",         state: "TX" },
  "San Jacinto College":                   { lat: 29.6948, lng: -95.1586, city: "Pasadena",         state: "TX" },
  "Lone Star College":                     { lat: 30.1588, lng: -95.4613, city: "The Woodlands",    state: "TX" },

  // ── Private ──────────────────────────────────────────────────────────────────
  "TCU":                                   { lat: 32.7096, lng: -97.3617, city: "Fort Worth",       state: "TX" },
  "Baylor":                                { lat: 31.5488, lng: -97.1131, city: "Waco",             state: "TX" },

  // ── LACCD (California) ───────────────────────────────────────────────────
  "Los Angeles City College":              { lat: 34.0836, lng: -118.3004, city: "Los Angeles",     state: "CA" },
  "Pierce College":                        { lat: 34.1780, lng: -118.5756, city: "Woodland Hills",  state: "CA" },
  "Los Angeles Valley College":            { lat: 34.1719, lng: -118.3997, city: "Valley Glen",     state: "CA" },
  "Los Angeles Harbor College":            { lat: 33.7955, lng: -118.2876, city: "Wilmington",      state: "CA" },
  "East Los Angeles College":              { lat: 34.0224, lng: -118.1608, city: "Monterey Park",   state: "CA" },
  "West Los Angeles College":              { lat: 33.9672, lng: -118.4265, city: "Culver City",     state: "CA" },
  "Los Angeles Mission College":           { lat: 34.2584, lng: -118.4345, city: "Sylmar",          state: "CA" },
  "Los Angeles Southwest College":         { lat: 33.9325, lng: -118.3075, city: "Los Angeles",     state: "CA" },
  "LA Trade-Technical College":            { lat: 34.0392, lng: -118.2609, city: "Los Angeles",     state: "CA" },

  // ── CSU (California) ─────────────────────────────────────────────────────
  "CSU Long Beach":                        { lat: 33.7838, lng: -118.1141, city: "Long Beach",       state: "CA" },
  "CSU Sacramento":                        { lat: 38.5582, lng: -121.4238, city: "Sacramento",       state: "CA" },
  "CSU Fullerton":                         { lat: 33.8826, lng: -117.8854, city: "Fullerton",        state: "CA" },
  "CSU Dominguez Hills":                   { lat: 33.8641, lng: -118.2535, city: "Carson",           state: "CA" },
  "CSU Northridge":                        { lat: 34.2410, lng: -118.5280, city: "Northridge",       state: "CA" },
  "SDSU (San Diego)":                      { lat: 32.7757, lng: -117.0719, city: "San Diego",        state: "CA" },
  "CSU San Francisco":                     { lat: 37.7244, lng: -122.4789, city: "San Francisco",    state: "CA" },
  "Cal Poly Pomona":                       { lat: 34.0576, lng: -117.8217, city: "Pomona",           state: "CA" },
  "CSU San Bernardino":                    { lat: 34.1825, lng: -117.3242, city: "San Bernardino",   state: "CA" },
  "CSU Stanislaus":                        { lat: 37.5257, lng: -120.8570, city: "Turlock",          state: "CA" },
  "CSU Chico":                             { lat: 39.7285, lng: -121.8477, city: "Chico",            state: "CA" },
  "Cal Poly San Luis Obispo":              { lat: 35.3050, lng: -120.6625, city: "San Luis Obispo",  state: "CA" },
  "CSU Los Angeles":                       { lat: 34.0656, lng: -118.1687, city: "Los Angeles",      state: "CA" },
  "CSU Humboldt":                          { lat: 40.8757, lng: -124.0787, city: "Arcata",           state: "CA" },
  "CSU San José":                          { lat: 37.3352, lng: -121.8811, city: "San José",         state: "CA" },
  "CSU San Marcos":                        { lat: 33.1283, lng: -117.1566, city: "San Marcos",       state: "CA" },

  // ── UC System (California) ───────────────────────────────────────────────
  "UC Berkeley":                           { lat: 37.8724, lng: -122.2595, city: "Berkeley",          state: "CA" },
  "UC Davis":                              { lat: 38.5382, lng: -121.7617, city: "Davis",              state: "CA" },
  "UC Davis Health":                       { lat: 38.5541, lng: -121.4562, city: "Sacramento",         state: "CA" },
  "UC Irvine":                             { lat: 33.6405, lng: -117.8443, city: "Irvine",             state: "CA" },
  "UC Irvine Health":                      { lat: 33.7701, lng: -117.8675, city: "Orange",             state: "CA" },
  "UCLA":                                  { lat: 34.0689, lng: -118.4452, city: "Los Angeles",        state: "CA" },
  "UCLA Health":                           { lat: 34.0664, lng: -118.4449, city: "Los Angeles",        state: "CA" },
  "UC Merced":                             { lat: 37.3655, lng: -120.4227, city: "Merced",             state: "CA" },
  "UC Riverside":                          { lat: 33.9737, lng: -117.3281, city: "Riverside",          state: "CA" },
  "UC Riverside Health":                   { lat: 33.9770, lng: -117.3743, city: "Riverside",          state: "CA" },
  "UC San Diego":                          { lat: 32.8801, lng: -117.2340, city: "La Jolla",           state: "CA" },
  "UC San Diego Health":                   { lat: 32.8740, lng: -117.2290, city: "La Jolla",           state: "CA" },
  "UCSF":                                  { lat: 37.7631, lng: -122.4578, city: "San Francisco",      state: "CA" },
  "UCSF Health":                           { lat: 37.7631, lng: -122.4590, city: "San Francisco",      state: "CA" },
  "UC Santa Barbara":                      { lat: 34.4140, lng: -119.8489, city: "Santa Barbara",      state: "CA" },
  "UC Santa Cruz":                         { lat: 36.9916, lng: -122.0583, city: "Santa Cruz",         state: "CA" },
  "Lawrence Berkeley National Laboratory": { lat: 37.8755, lng: -122.2477, city: "Berkeley",           state: "CA" },
  "UC Agriculture and Natural Resources":  { lat: 38.5382, lng: -121.7450, city: "Davis",              state: "CA" },
  "UC Systemwide / Office of the President": { lat: 37.8706, lng: -122.2727, city: "Oakland",         state: "CA" },
};
