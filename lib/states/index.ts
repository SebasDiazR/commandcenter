import type { StateConfig } from "@/lib/types";
import { TEXAS_STATE } from "./texas";
import { CALIFORNIA_STATE } from "./california";

export { TEXAS_STATE } from "./texas";
export { CALIFORNIA_STATE } from "./california";

export const ALL_STATES: StateConfig[] = [
  TEXAS_STATE,
  CALIFORNIA_STATE,
];

export function getStateById(id: string): StateConfig {
  return ALL_STATES.find(s => s.id === id) ?? TEXAS_STATE;
}
