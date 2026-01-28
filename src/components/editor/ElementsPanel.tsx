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
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabelElement } from '@/types/label';

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  qrcode: <QrCode className="h-4 w-4" />,
  barcode: <Barcode className="h-4 w-4" />,
  rectangle: <div className="h-4 w-4 border border-current rounded-sm" />,
  line: <div className="h-0.5 w-4 bg-current rounded-full" />,
};

function ElementItem({ element, isSelected }: { element: LabelElement; isSelected: boolean }) {
  const { setSelectedElementId, updateElement, deleteElement } = useLabelEditorContext();

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
        isSelected 
          ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
          : "hover:bg-accent/50 border border-transparent"
      )}
      onClick={() => setSelectedElementId(element.id)}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity" />
      
      <span className={cn(
        "flex items-center justify-center w-6 h-6 rounded-md",
        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {ELEMENT_ICONS[element.type]}
      </span>
      
      <span className="flex-1 text-sm font-medium truncate">
        {element.name}
      </span>
      
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent"
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
          className="h-6 w-6 hover:bg-accent"
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
          className="h-6 w-6 text-destructive hover:bg-destructive/10"
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Add Elements</h2>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="p-4 space-y-3 border-b">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 bg-background/50 hover:bg-accent/50 hover:border-primary/30 transition-colors"
            onClick={() => addElement('text')}
          >
            <Type className="h-4 w-4 text-primary" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 bg-background/50 hover:bg-accent/50 hover:border-primary/30 transition-colors"
            onClick={() => addElement('qrcode')}
          >
            <QrCode className="h-4 w-4 text-primary" />
            QR Code
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-10 gap-2 bg-background/50 hover:bg-accent/50 hover:border-primary/30 transition-colors"
          onClick={() => addElement('barcode')}
        >
          <Barcode className="h-4 w-4 text-primary" />
          Barcode
        </Button>
      </div>

      {/* Presets */}
      <div className="p-4 border-b">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Presets</p>
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 h-9 hover:bg-accent/50"
            onClick={() => addElement('text')}
          >
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
              <Type className="h-3 w-3" />
            </div>
            <span className="text-xs">Item Name (Bold)</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 h-9 hover:bg-accent/50"
            onClick={() => addElement('text')}
          >
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
              <Type className="h-3 w-3" />
            </div>
            <span className="text-xs">Location (Small)</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 h-9 hover:bg-accent/50"
            onClick={() => addElement('qrcode')}
          >
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
              <QrCode className="h-3 w-3" />
            </div>
            <span className="text-xs">QR to Item</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 h-9 hover:bg-accent/50"
            onClick={() => addElement('barcode')}
          >
            <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
              <Barcode className="h-3 w-3" />
            </div>
            <span className="text-xs">Asset ID Barcode</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Elements List / Layers */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 pb-2 flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Layers ({label.elements.length})
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-3 pb-3 space-y-1">
            {label.elements.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium">No elements yet</p>
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
