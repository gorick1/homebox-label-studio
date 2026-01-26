import { LabelEditorProvider } from '@/contexts/LabelEditorContext';
import EditorToolbar from '@/components/editor/EditorToolbar';
import ElementsPanel from '@/components/editor/ElementsPanel';
import LabelCanvas from '@/components/editor/LabelCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TemplatesPanel from '@/components/editor/TemplatesPanel';

// Key to force remount on HMR issues
const EDITOR_KEY = 'label-editor-v1';

export default function EditorPage() {
  return (
    <LabelEditorProvider key={EDITOR_KEY}>
      <div className="h-screen flex flex-col bg-background">
        <EditorToolbar />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar: Elements + Templates */}
          <div className="flex flex-col border-r">
            <ElementsPanel />
            <TemplatesPanel />
          </div>
          
          {/* Center: Canvas */}
          <LabelCanvas />
          
          {/* Right sidebar: Properties */}
          <PropertiesPanel />
        </div>
      </div>
    </LabelEditorProvider>
  );
}
