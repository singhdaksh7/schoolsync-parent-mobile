import React, { createContext, useContext, useMemo, useState } from 'react';

// The Parent Portal's multi-child switcher must stay in sync across the grid
// landing screen and every per-module detail screen (Fees/Homework/etc.) —
// each of those screens calls useParentDashboard() independently (same
// pattern as the Student Portal's per-module screens), so the selected child
// has to live above any single screen's local state, not reset to the first
// child every time a tile is opened.
type ParentSelectionState = {
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
};

const ParentSelectionContext = createContext<ParentSelectionState | null>(null);

export function ParentSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const value = useMemo(() => ({ selectedStudentId, setSelectedStudentId }), [selectedStudentId]);
  return <ParentSelectionContext.Provider value={value}>{children}</ParentSelectionContext.Provider>;
}

export function useParentSelection(): ParentSelectionState {
  const ctx = useContext(ParentSelectionContext);
  if (!ctx) throw new Error('useParentSelection must be used within a ParentSelectionProvider');
  return ctx;
}
