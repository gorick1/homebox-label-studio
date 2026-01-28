import { LabelEditorProvider } from '@/contexts/LabelEditorContext';
import EditorToolbar from '@/components/editor/EditorToolbar';
import ElementsPanel from '@/components/editor/ElementsPanel';
import LabelCanvas from '@/components/editor/LabelCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TemplatesPanel from '@/components/editor/TemplatesPanel';
import { useAutoprintMonitor } from '@/hooks/useAutoprintMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';

// Key to force remount on HMR issues
const EDITOR_KEY = 'label-editor-v1';

function EditorContent() {
  const { isDemoMode } = useAuth();
  
  // Start the autoprint monitor when editor is loaded
  useAutoprintMonitor();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header region with high z-index */}
      <div className="relative z-50">
        <EditorToolbar />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Elements + Templates - higher z-index to stay above canvas */}
        <aside className="w-80 border-r bg-card/50 glass-panel relative z-20 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="pr-3">
              <ElementsPanel />
              <TemplatesPanel />
            </div>
          </ScrollArea>
        </aside>
        
        {/* Center: Canvas - lower stacking context */}
        <main className="flex-1 flex flex-col min-w-0 relative z-0">
          <LabelCanvas />
        </main>
        
        {/* Right sidebar: Properties */}
        <aside className="w-80 border-l bg-card/50 glass-panel overflow-hidden">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <LabelEditorProvider key={EDITOR_KEY}>
      <EditorContent />
    </LabelEditorProvider>
  );
}
