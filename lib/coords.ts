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
};
