import React, { createContext, useContext, useMemo, useState } from "react";

const ScenarioJobContext = createContext(null);

export function ScenarioJobProvider({ children }) {
  const [job, setJob] = useState(null);
  const value = useMemo(() => ({ job, setJob }), [job]);
  return (
    <ScenarioJobContext.Provider value={value}>
      {children}
    </ScenarioJobContext.Provider>
  );
}

export function useScenarioJob() {
  const ctx = useContext(ScenarioJobContext);
  if (!ctx) throw new Error("useScenarioJob must be used within ScenarioJobProvider");
  return ctx;
}
