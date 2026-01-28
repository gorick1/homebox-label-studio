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
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Demo Mode
          </span>
          <Badge variant="secondary" className="text-xs">
            No Homebox connection
          </Badge>
        </div>
      )}
      
      <EditorToolbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Elements + Templates */}
        <aside className="w-72 border-r bg-card/50 glass-panel relative z-10 overflow-hidden">
          <ScrollArea className="h-full">
            <ElementsPanel />
            <TemplatesPanel />
          </ScrollArea>
        </aside>
        
        {/* Center: Canvas - takes most of the space */}
        <main className="flex-1 flex flex-col min-w-0">
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
