import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';

interface EditorSettings {
  autoprint: boolean;
  snapToGrid: boolean;
  showGrid: boolean;
}

interface EditorSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

export default function EditorSettingsPanel({ open, onOpenChange, settings, onSettingsChange }: EditorSettingsPanelProps) {
  const handleAutoprintChange = (checked: boolean) => {
    onSettingsChange({ ...settings, autoprint: checked });
  };

  const handleSnapToGridChange = (checked: boolean) => {
    onSettingsChange({ ...settings, snapToGrid: checked });
  };

  const handleShowGridChange = (checked: boolean) => {
    onSettingsChange({ ...settings, showGrid: checked });
  };

  const handleResetSettings = () => {
    onSettingsChange({
      autoprint: false,
      snapToGrid: true,
      showGrid: true,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Editor Settings</SheetTitle>
          <SheetDescription>
            Configure label editor behavior
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Print Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Print Settings</h3>
            <div className="flex items-center justify-between space-x-2">
              <Label 
                htmlFor="autoprint" 
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Auto-print when creating items
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically print labels when new items are added from this editor
                </p>
              </Label>
              <Switch
                id="autoprint"
                checked={settings.autoprint}
                onCheckedChange={handleAutoprintChange}
              />
            </div>
          </div>

          {/* Canvas Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Canvas Settings</h3>
            
            <div className="flex items-center justify-between space-x-2">
              <Label 
                htmlFor="show-grid" 
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Show grid
              </Label>
              <Switch
                id="show-grid"
                checked={settings.showGrid}
                onCheckedChange={handleShowGridChange}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label 
                htmlFor="snap-to-grid" 
                className="text-sm font-normal cursor-pointer flex-1"
              >
                Snap to grid
              </Label>
              <Switch
                id="snap-to-grid"
                checked={settings.snapToGrid}
                onCheckedChange={handleSnapToGridChange}
              />
            </div>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleResetSettings}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
