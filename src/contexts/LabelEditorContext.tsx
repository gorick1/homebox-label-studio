import React, { createContext, useContext } from 'react';
import { useLabelEditor, type LabelEditorState } from '@/hooks/useLabelEditor';
import type { Label } from '@/types/label';

const LabelEditorContext = createContext<LabelEditorState | null>(null);

interface LabelEditorProviderProps {
  children: React.ReactNode;
  initialLabel?: Label;
}

export function LabelEditorProvider({ children, initialLabel }: LabelEditorProviderProps) {
  const editorState = useLabelEditor(initialLabel);
  
  return (
    <LabelEditorContext.Provider value={editorState}>
      {children}
    </LabelEditorContext.Provider>
  );
}

export function useLabelEditorContext() {
  const context = useContext(LabelEditorContext);
  if (!context) {
    throw new Error('useLabelEditorContext must be used within a LabelEditorProvider');
  }
  return context;
}
