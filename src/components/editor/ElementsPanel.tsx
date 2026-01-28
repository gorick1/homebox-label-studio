import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  QrCode, 
  Barcode, 
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Unlock,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabelElement } from '@/types/label';

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  qrcode: <QrCode className="h-4 w-4" />,
  barcode: <Barcode className="h-4 w-4" />,
  rectangle: <div className="h-4 w-4 border border-current" />,
  line: <div className="h-0.5 w-4 bg-current" />,
};

function ElementItem({ element, isSelected }: { element: LabelElement; isSelected: boolean }) {
  const { setSelectedElementId, updateElement, deleteElement } = useLabelEditorContext();

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
        isSelected 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-muted"
      )}
      onClick={() => setSelectedElementId(element.id)}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
      
      <span className="text-muted-foreground">
        {ELEMENT_ICONS[element.type]}
      </span>
      
      <span className="flex-1 text-sm truncate">
        {element.name}
      </span>
      
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            updateElement(element.id, { visible: !element.visible });
          }}
        >
          {element.visible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            updateElement(element.id, { locked: !element.locked });
          }}
        >
          {element.locked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <Unlock className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            deleteElement(element.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function ElementsPanel() {
  const { label, selectedElementId, addElement } = useLabelEditorContext();

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Elements</h2>
      </div>

      {/* Quick Add */}
      <div className="p-3 border-b space-y-2">
        <p className="text-xs text-muted-foreground mb-2">Add Element</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => addElement('text')}
          >
            <Type className="h-4 w-4" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => addElement('qrcode')}
          >
            <QrCode className="h-4 w-4" />
            QR
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => addElement('barcode')}
        >
          <Barcode className="h-4 w-4" />
          Barcode
        </Button>
      </div>

      {/* Presets */}
      <div className="p-3 border-b">
        <p className="text-xs text-muted-foreground mb-2">Quick Presets</p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => {
              // This would add a pre-configured element
              addElement('text');
            }}
          >
            <Type className="h-3.5 w-3.5" />
            <span className="text-xs">Item Name (Bold)</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => addElement('text')}
          >
            <Type className="h-3.5 w-3.5" />
            <span className="text-xs">Location (Small)</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => addElement('qrcode')}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="text-xs">QR to Item</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-8"
            onClick={() => addElement('barcode')}
          >
            <Barcode className="h-3.5 w-3.5" />
            <span className="text-xs">Asset ID Barcode</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Elements List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-3 pb-0">
          <p className="text-xs text-muted-foreground">
            Layers ({label.elements.length})
          </p>
        </div>
        <ScrollArea className="h-full">
          <div className="p-2 space-y-0.5">
            {label.elements.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p>No elements yet</p>
                <p className="text-xs mt-1">Add elements using the buttons above</p>
              </div>
            ) : (
              // Reverse to show top-most layer first
              [...label.elements].reverse().map((element) => (
                <ElementItem
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
