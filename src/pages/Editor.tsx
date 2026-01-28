import { LabelEditorProvider } from '@/contexts/LabelEditorContext';
import EditorToolbar from '@/components/editor/EditorToolbar';
import ElementsPanel from '@/components/editor/ElementsPanel';
import LabelCanvas from '@/components/editor/LabelCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TemplatesPanel from '@/components/editor/TemplatesPanel';
import { useAutoprintMonitor } from '@/hooks/useAutoprintMonitor';

// Key to force remount on HMR issues
const EDITOR_KEY = 'label-editor-v1';

function EditorContent() {
  // Start the autoprint monitor when editor is loaded
  useAutoprintMonitor();

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorToolbar />
      
      <div className="flex-1 flex overflow-hidden gap-1">
        {/* Left sidebar: Elements + Templates */}
        <div className="flex flex-col w-80 border-r overflow-hidden">
          <ElementsPanel />
          <TemplatesPanel />
        </div>
        
        {/* Center: Canvas - takes most of the space */}
        <div className="flex-1 flex flex-col min-w-0">
          <LabelCanvas />
        </div>
        
        {/* Right sidebar: Properties */}
        <div className="w-80 border-l overflow-hidden">
          <PropertiesPanel />
        </div>
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
