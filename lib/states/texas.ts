import { RAW_DATA } from "@/lib/data";
import { SYSTEM_COLORS } from "@/lib/constants";
import type { StateConfig } from "@/lib/types";

export const TEXAS_STATE: StateConfig = {
  id: "tx",
  name: "Texas",
  abbreviation: "TX",
  fullLabel: "Texas Higher Ed · FY 2026–2030",
  tagline: "100+ institutions · $50B+ pipeline · FY 2026–2030",
  color: "#BF5700",         // UT burnt orange — quintessentially Texan
  accentColor: "#500000",   // Aggie maroon
  mapCenter: [31.0, -99.0],
  mapZoom: 6,
  rawData: RAW_DATA,
  systemColors: SYSTEM_COLORS,
  startYear: 2026,
};
