"use client";
import React, { useState } from "react";
import { StateProvider } from "@/lib/StateContext";
import StateSelector from "./StateSelector";
import BDCommandCenter from "./BDCommandCenter";

export default function AppShell() {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  if (!selectedState) {
    return <StateSelector onSelect={setSelectedState} />;
  }

  return (
    <StateProvider
      stateId={selectedState}
      onSwitchState={setSelectedState}
      onReturnToSelector={() => setSelectedState(null)}
    >
      <BDCommandCenter />
    </StateProvider>
  );
}
