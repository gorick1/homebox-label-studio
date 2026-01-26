import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, Type, QrCode, Barcode, Trash2, Copy, Tag } from 'lucide-react';
import { FONT_FAMILIES, PLACEHOLDERS, type TextElement, type QRCodeElement } from '@/types/label';
import { containsPlaceholders } from '@/lib/dymoFormat';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function PropertiesPanel() {
  const { 
    selectedElement, 
    updateElement, 
    deleteElement, 
    duplicateElement,
    selectedElementId,
  } = useLabelEditorContext();

  if (!selectedElement || !selectedElementId) {
    return (
      <div className="w-72 border-l bg-background p-4 flex flex-col">
        <h2 className="font-semibold text-sm text-muted-foreground mb-4">Properties</h2>
        <div className="flex-1 flex items-center justify-center text-center text-sm text-muted-foreground">
          <p>Select an element on the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const isText = selectedElement.type === 'text';
  const isQRCode = selectedElement.type === 'qrcode';
  const textElement = isText ? (selectedElement as TextElement) : null;
  const qrElement = isQRCode ? (selectedElement as QRCodeElement) : null;

  const hasPlaceholders = isText 
    ? containsPlaceholders(textElement!.content)
    : isQRCode 
      ? containsPlaceholders(qrElement!.data)
      : false;

  const insertPlaceholder = (placeholder: string) => {
    if (isText && textElement) {
      updateElement(selectedElementId, {
        content: textElement.content + placeholder,
      });
    } else if (isQRCode && qrElement) {
      updateElement(selectedElementId, {
        data: qrElement.data + placeholder,
      });
    }
  };

  return (
    <div className="w-72 border-l bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isText && <Type className="h-4 w-4 text-muted-foreground" />}
            {isQRCode && <QrCode className="h-4 w-4 text-muted-foreground" />}
            {selectedElement.type === 'barcode' && <Barcode className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium text-sm">{selectedElement.name}</span>
          </div>
          {hasPlaceholders && (
            <Badge variant="secondary" className="text-xs">
              Dynamic
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Position & Size */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X (inches)</Label>
              <Input
                type="number"
                step="0.01"
                value={selectedElement.position.x.toFixed(3)}
                onChange={(e) => updateElement(selectedElementId, {
                  position: { ...selectedElement.position, x: parseFloat(e.target.value) || 0 }
                })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y (inches)</Label>
              <Input
                type="number"
                step="0.01"
                value={selectedElement.position.y.toFixed(3)}
                onChange={(e) => updateElement(selectedElementId, {
                  position: { ...selectedElement.position, y: parseFloat(e.target.value) || 0 }
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                step="0.01"
                min="0.1"
                value={selectedElement.size.width.toFixed(3)}
                onChange={(e) => updateElement(selectedElementId, {
                  size: { ...selectedElement.size, width: parseFloat(e.target.value) || 0.1 }
                })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                step="0.01"
                min="0.1"
                value={selectedElement.size.height.toFixed(3)}
                onChange={(e) => updateElement(selectedElementId, {
                  size: { ...selectedElement.size, height: parseFloat(e.target.value) || 0.1 }
                })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Text-specific properties */}
        {isText && textElement && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Text Content</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                      <Tag className="h-3 w-3" />
                      <span className="text-xs">Insert</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Placeholders</p>
                      {PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => insertPlaceholder(p.key)}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                        >
                          <span className="font-mono text-xs">{p.key}</span>
                          <span className="block text-xs text-muted-foreground">{p.description}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                value={textElement.content}
                onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                className="min-h-[80px] text-sm font-mono"
                placeholder="Enter text content..."
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font</h3>
              <div className="space-y-2">
                <Label className="text-xs">Family</Label>
                <Select
                  value={textElement.font.family}
                  onValueChange={(value) => updateElement(selectedElementId, {
                    font: { ...textElement.font, family: value }
                  })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Size</Label>
                  <span className="text-xs text-muted-foreground">{textElement.font.size}pt</span>
                </div>
                <Slider
                  value={[textElement.font.size]}
                  onValueChange={([value]) => updateElement(selectedElementId, {
                    font: { ...textElement.font, size: value }
                  })}
                  min={6}
                  max={72}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant={textElement.font.bold ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateElement(selectedElementId, {
                    font: { ...textElement.font, bold: !textElement.font.bold }
                  })}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant={textElement.font.italic ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateElement(selectedElementId, {
                    font: { ...textElement.font, italic: !textElement.font.italic }
                  })}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* QR Code properties */}
        {isQRCode && qrElement && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Data</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1">
                    <Tag className="h-3 w-3" />
                    <span className="text-xs">Insert</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Placeholders</p>
                    {PLACEHOLDERS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => insertPlaceholder(p.key)}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                      >
                        <span className="font-mono text-xs">{p.key}</span>
                        <span className="block text-xs text-muted-foreground">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              value={qrElement.data}
              onChange={(e) => updateElement(selectedElementId, { data: e.target.value })}
              className="min-h-[80px] text-sm font-mono"
              placeholder="Enter URL or data..."
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders like {'{item_id}'} for dynamic QR codes
            </p>
          </div>
        )}

        <Separator />

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Visible</Label>
          <Switch
            checked={selectedElement.visible}
            onCheckedChange={(checked) => updateElement(selectedElementId, { visible: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Locked</Label>
          <Switch
            checked={selectedElement.locked}
            onCheckedChange={(checked) => updateElement(selectedElementId, { locked: checked })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => duplicateElement(selectedElementId)}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={() => deleteElement(selectedElementId)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
