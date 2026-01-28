import { useState } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Grid3X3,
  Download,
  Printer,
  Settings,
  LogOut,
  User,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { LABEL_SIZES, type HomeboxItem } from '@/types/label';
import { labelToXml, downloadLabelFile, substitutePlaceholders } from '@/lib/dymoFormat';
import { printLabel } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ItemBrowser from './ItemBrowser';
import EditorSettingsPanel from './EditorSettingsPanel';

export default function EditorToolbar() {
  const { 
    label, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    zoom, 
    setZoom,
    showGrid,
    setShowGrid,
    setLabelSize,
    setLabelName,
    previewItem,
    setPreviewItem,
    isPreviewMode,
    setIsPreviewMode,
    editorSettings,
    setEditorSettings,
  } = useLabelEditorContext();
  
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSelectItem = (item: HomeboxItem | null) => {
    setPreviewItem(item);
    if (item) {
      setIsPreviewMode(true);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Get the label canvas and convert to PNG
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Canvas not found');
      
      // Convert to blob and send to printer
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create PNG')), 'image/png');
      });
      
      const result = await printLabel(blob);
      
      if (!result.ok) throw new Error(result.message);
      
      toast({
        title: "Label sent to printer",
        description: previewItem ? `Printing label for "${previewItem.name}"` : "Your label is being printed.",
      });
    } catch (error) {
      toast({
        title: "Print failed",
        description: error instanceof Error ? error.message : "Could not send label to printer",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = () => {
    if (isPreviewMode && previewItem) {
      // Download with substituted data
      const itemData: Record<string, string> = {
        '{item_name}': previewItem.name,
        '{location}': previewItem.location.path,
        '{quantity}': previewItem.quantity.toString(),
        '{item_id}': previewItem.id,
        '{asset_id}': previewItem.assetId,
        '{description}': previewItem.description,
        '{notes}': previewItem.notes,
      };
      
      // Create a temporary label with substituted content
      const substitutedLabel = {
        ...label,
        elements: label.elements.map(el => {
          if (el.type === 'text') {
            return { ...el, content: substitutePlaceholders(el.content, itemData) };
          } else if (el.type === 'qrcode') {
            return { ...el, data: substitutePlaceholders(el.data, itemData) };
          } else if (el.type === 'barcode') {
            return { ...el, data: substitutePlaceholders(el.data, itemData) };
          }
          return el;
        }),
      };
      
      downloadLabelFile(substitutedLabel, `${previewItem.name.replace(/\s+/g, '_')}_label.lbl`);
      toast({
        title: "Label downloaded",
        description: `Label for "${previewItem.name}" has been saved.`,
      });
    } else {
      downloadLabelFile(label);
      toast({
        title: "Label downloaded",
        description: `${label.name}.lbl has been saved.`,
      });
    }
  };

  const zoomPresets = [25, 50, 75, 100, 150, 200, 300, 400];

  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold hidden sm:inline">Homebox Labels</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Label Name */}
      <Input
        value={label.name}
        onChange={(e) => setLabelName(e.target.value)}
        className="w-40 h-8 text-sm"
        placeholder="Label name"
      />

      {/* Label Size */}
      <Select
        value={label.size.id}
        onValueChange={(value) => {
          const size = LABEL_SIZES.find(s => s.id === value);
          if (size) setLabelSize(size);
        }}
      >
        <SelectTrigger className="w-40 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LABEL_SIZES.map((size) => (
            <SelectItem key={size.id} value={size.id}>
              {size.name} ({size.width}" × {size.height}")
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <Select
          value={zoom.toString()}
          onValueChange={(value) => setZoom(parseInt(value))}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {zoomPresets.map((z) => (
              <SelectItem key={z} value={z.toString()}>
                {z}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(Math.min(400, zoom + 25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={showGrid ? "secondary" : "ghost"}
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Grid</TooltipContent>
        </Tooltip>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Item Browser & Preview Toggle */}
      <div className="flex items-center gap-2">
        <ItemBrowser 
          onSelectItem={handleSelectItem}
          selectedItem={previewItem}
        />
        
        {previewItem && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={isPreviewMode ? "secondary" : "ghost"}
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                {isPreviewMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPreviewMode ? 'Showing real data' : 'Show placeholders'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>

        <Button size="sm" className="gap-2" onClick={handlePrint} disabled={isPrinting}>
          {isPrinting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Settings Sheet */}
      <div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <EditorSettingsPanel 
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={editorSettings}
          onSettingsChange={setEditorSettings}
        />
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
