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
      {/* Header region: banner + toolbar with high z-index */}
      <div className="relative z-50">
        {/* Demo mode banner - pointer-events-none to avoid blocking toolbar */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2 pointer-events-none">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Demo Mode
            </span>
            <Badge variant="secondary" className="text-xs pointer-events-auto">
              No Homebox connection
            </Badge>
          </div>
        )}
        
        <EditorToolbar />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Elements + Templates - higher z-index to stay above canvas */}
        <aside className="w-72 border-r bg-card/50 glass-panel relative z-20 overflow-hidden">
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
