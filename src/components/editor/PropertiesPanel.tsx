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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bold, Italic, Type, QrCode, Barcode, Trash2, Copy, Tag, Move, Maximize2, MapPin, Mail } from 'lucide-react';
import { FONT_FAMILIES, PLACEHOLDERS, type TextElement, type QRCodeElement, type BarcodeElement, type AddressElement, type IMBarcodeElement } from '@/types/label';
import { containsPlaceholders } from '@/lib/dymoFormat';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AddressPropertiesPanel from './AddressPropertiesPanel';

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
      <div className="h-full flex flex-col p-6">
        <h2 className="font-semibold text-sm text-muted-foreground mb-6">Properties</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Move className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No selection</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Select an element to edit</p>
          </div>
        </div>
      </div>
    );
  }

  const isText = selectedElement.type === 'text';
  const isQRCode = selectedElement.type === 'qrcode';
  const isBarcode = selectedElement.type === 'barcode';
  const isAddress = selectedElement.type === 'address';
  const isIMBarcode = selectedElement.type === 'imbarcode';
  const textElement = isText ? (selectedElement as TextElement) : null;
  const qrElement = isQRCode ? (selectedElement as QRCodeElement) : null;
  const barcodeElement = isBarcode ? (selectedElement as BarcodeElement) : null;
  const addressElement = isAddress ? (selectedElement as AddressElement) : null;
  const imbElement = isIMBarcode ? (selectedElement as IMBarcodeElement) : null;

  const hasPlaceholders = isText 
    ? containsPlaceholders(textElement!.content)
    : isQRCode 
      ? containsPlaceholders(qrElement!.data)
      : isBarcode
        ? containsPlaceholders(barcodeElement!.data)
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
    } else if (isBarcode && barcodeElement) {
      updateElement(selectedElementId, {
        data: barcodeElement.data + placeholder,
      });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-primary/10 text-primary"
            )}>
              {isText && <Type className="h-4 w-4" />}
              {isQRCode && <QrCode className="h-4 w-4" />}
              {isBarcode && <Barcode className="h-4 w-4" />}
              {isAddress && <MapPin className="h-4 w-4" />}
              {isIMBarcode && <Mail className="h-4 w-4" />}
            </div>
            <span className="font-medium text-sm">{selectedElement.name}</span>
          </div>
          {hasPlaceholders && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
              Dynamic
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Position & Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Move className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">X (inches)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedElement.position.x.toFixed(3)}
                  onChange={(e) => updateElement(selectedElementId, {
                    position: { ...selectedElement.position, x: parseFloat(e.target.value) || 0 }
                  })}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Y (inches)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedElement.position.y.toFixed(3)}
                  onChange={(e) => updateElement(selectedElementId, {
                    position: { ...selectedElement.position, y: parseFloat(e.target.value) || 0 }
                  })}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={selectedElement.size.width.toFixed(3)}
                  onChange={(e) => updateElement(selectedElementId, {
                    size: { ...selectedElement.size, width: parseFloat(e.target.value) || 0.1 }
                  })}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={selectedElement.size.height.toFixed(3)}
                  onChange={(e) => updateElement(selectedElementId, {
                    size: { ...selectedElement.size, height: parseFloat(e.target.value) || 0.1 }
                  })}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Text-specific properties */}
          {isText && textElement && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</h3>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Tag className="h-3 w-3" />
                        <span className="text-xs">Insert</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-popover border shadow-elevation-lg" align="end">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Placeholders</p>
                        {PLACEHOLDERS.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => insertPlaceholder(p.key)}
                            className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <span className="font-mono text-xs text-primary">{p.key}</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">{p.description}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={textElement.content}
                  onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                  className="min-h-[80px] text-sm font-mono bg-background/50 resize-none"
                  placeholder="Enter text content..."
                />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Family</Label>
                    <Select
                      value={textElement.font.family}
                      onValueChange={(value) => updateElement(selectedElementId, {
                        font: { ...textElement.font, family: value }
                      })}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-elevation-lg">
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
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <span className="text-xs font-medium text-foreground">{textElement.font.size}pt</span>
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
                      className="h-9 w-9"
                      onClick={() => updateElement(selectedElementId, {
                        font: { ...textElement.font, bold: !textElement.font.bold }
                      })}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={textElement.font.italic ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => updateElement(selectedElementId, {
                        font: { ...textElement.font, italic: !textElement.font.italic }
                      })}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* QR Code properties */}
          {isQRCode && qrElement && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Data</h3>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                      <Tag className="h-3 w-3" />
                      <span className="text-xs">Insert</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-popover border shadow-elevation-lg" align="end">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Placeholders</p>
                      {PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => insertPlaceholder(p.key)}
                          className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                        >
                          <span className="font-mono text-xs text-primary">{p.key}</span>
                          <span className="block text-xs text-muted-foreground mt-0.5">{p.description}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                value={qrElement.data}
                onChange={(e) => updateElement(selectedElementId, { data: e.target.value })}
                className="min-h-[80px] text-sm font-mono bg-background/50 resize-none"
                placeholder="Enter URL or data..."
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders like <code className="text-primary">{'{item_id}'}</code> for dynamic QR codes
              </p>
            </div>
          )}

          {/* Barcode properties */}
          {isBarcode && barcodeElement && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</h3>
                </div>
                <Select
                  value={barcodeElement.format}
                  onValueChange={(value: BarcodeElement['format']) => updateElement(selectedElementId, { format: value })}
                >
                  <SelectTrigger className="h-9 text-sm bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-elevation-lg">
                    <SelectItem value="code128">Code 128 (Recommended)</SelectItem>
                    <SelectItem value="code39">Code 39</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Tag className="h-3 w-3" />
                        <span className="text-xs">Insert</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-popover border shadow-elevation-lg" align="end">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Placeholders</p>
                        {PLACEHOLDERS.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => insertPlaceholder(p.key)}
                            className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                          >
                            <span className="font-mono text-xs text-primary">{p.key}</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">{p.description}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={barcodeElement.data}
                  onChange={(e) => updateElement(selectedElementId, { data: e.target.value })}
                  className="min-h-[60px] text-sm font-mono bg-background/50 resize-none"
                  placeholder="Enter barcode data..."
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="text-primary">{'{asset_id}'}</code> for scannable asset tracking
                </p>
              </div>

              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Show Text Below</Label>
                <Switch
                  checked={barcodeElement.showText}
                  onCheckedChange={(checked) => updateElement(selectedElementId, { showText: checked })}
                />
              </div>
            </>
          )}

          {/* Address properties */}
          {isAddress && addressElement && (
            <AddressPropertiesPanel element={addressElement} />
          )}

          {/* IMBarcode properties */}
          {isIMBarcode && imbElement && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intelligent Mail Barcode</h3>
              </div>
              
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Barcode ID</Label>
                  <Input
                    value={imbElement.barcodeId}
                    onChange={(e) => updateElement(selectedElementId, { barcodeId: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    maxLength={2}
                    placeholder="00"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Service Type ID</Label>
                  <Input
                    value={imbElement.serviceTypeId}
                    onChange={(e) => updateElement(selectedElementId, { serviceTypeId: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    maxLength={3}
                    placeholder="001"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Mailer ID</Label>
                  <Input
                    value={imbElement.mailerId}
                    onChange={(e) => updateElement(selectedElementId, { mailerId: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    maxLength={9}
                    placeholder="6 or 9 digits"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Serial Number</Label>
                  <Input
                    value={imbElement.serialNumber}
                    onChange={(e) => updateElement(selectedElementId, { serialNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    maxLength={9}
                    placeholder="Auto-generated"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Routing Code (ZIP)</Label>
                  <Input
                    value={imbElement.routingCode}
                    onChange={(e) => updateElement(selectedElementId, { routingCode: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    maxLength={11}
                    placeholder="5, 9, or 11 digits"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between py-1">
                <Label className="text-sm">Show Text Below</Label>
                <Switch
                  checked={imbElement.showText}
                  onCheckedChange={(checked) => updateElement(selectedElementId, { showText: checked })}
                />
              </div>
            </div>
          )}

          <Separator className="bg-border/50" />

          {/* Visibility */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <Label className="text-sm">Visible</Label>
              <Switch
                checked={selectedElement.visible}
                onCheckedChange={(checked) => updateElement(selectedElementId, { visible: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <Label className="text-sm">Locked</Label>
              <Switch
                checked={selectedElement.locked}
                onCheckedChange={(checked) => updateElement(selectedElementId, { locked: checked })}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t bg-card/50 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 bg-background/50"
          onClick={() => duplicateElement(selectedElementId)}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          onClick={() => deleteElement(selectedElementId)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
