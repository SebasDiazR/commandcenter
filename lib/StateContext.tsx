"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import type { StateConfig } from "@/lib/types";
import { ALL_STATES, getStateById, TEXAS_STATE } from "@/lib/states";

interface StateContextValue {
  stateId: string;
  stateConfig: StateConfig;
  allStates: StateConfig[];
  switchState: (id: string) => void;
  returnToSelector: () => void;
}

const StateContext = createContext<StateContextValue>({
  stateId: "tx",
  stateConfig: TEXAS_STATE,
  allStates: ALL_STATES,
  switchState: () => {},
  returnToSelector: () => {},
});

export function useStateContext() {
  return useContext(StateContext);
}

interface StateProviderProps {
  stateId: string;
  onSwitchState: (id: string) => void;
  onReturnToSelector: () => void;
  children: React.ReactNode;
}

export function StateProvider({ stateId, onSwitchState, onReturnToSelector, children }: StateProviderProps) {
  const stateConfig = getStateById(stateId);

  const switchState = useCallback((id: string) => {
    onSwitchState(id);
  }, [onSwitchState]);

  return (
    <StateContext.Provider value={{ stateId, stateConfig, allStates: ALL_STATES, switchState, returnToSelector: onReturnToSelector }}>
      {children}
    </StateContext.Provider>
  );
}
