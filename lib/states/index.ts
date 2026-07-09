import type { StateConfig } from "@/lib/types";
import { TEXAS_STATE } from "./texas";
import { CALIFORNIA_STATE } from "./california";
import { FLORIDA_STATE } from "./florida";
import { NORTH_CAROLINA_STATE } from "./north-carolina";

export { TEXAS_STATE } from "./texas";
export { CALIFORNIA_STATE } from "./california";
export { FLORIDA_STATE } from "./florida";
export { NORTH_CAROLINA_STATE } from "./north-carolina";

export const ALL_STATES: StateConfig[] = [
  TEXAS_STATE,
  CALIFORNIA_STATE,
  FLORIDA_STATE,
  NORTH_CAROLINA_STATE,
];

export function getStateById(id: string): StateConfig {
  return ALL_STATES.find(s => s.id === id) ?? TEXAS_STATE;
}
