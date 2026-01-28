import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RotateCcw, ExternalLink } from 'lucide-react';
import { getUspsUserId, setUspsUserId, removeUspsUserId } from '@/lib/uspsApi';

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
  const [uspsUserId, setUspsUserIdState] = useState(getUspsUserId() || '');

  useEffect(() => {
    if (open) {
      setUspsUserIdState(getUspsUserId() || '');
    }
  }, [open]);

  const handleAutoprintChange = (checked: boolean) => {
    onSettingsChange({ ...settings, autoprint: checked });
  };

  const handleSnapToGridChange = (checked: boolean) => {
    onSettingsChange({ ...settings, snapToGrid: checked });
  };

  const handleShowGridChange = (checked: boolean) => {
    onSettingsChange({ ...settings, showGrid: checked });
  };

  const handleUspsUserIdChange = (value: string) => {
    setUspsUserIdState(value);
    if (value.trim()) {
      setUspsUserId(value.trim());
    } else {
      removeUspsUserId();
    }
  };

  const handleResetSettings = () => {
    onSettingsChange({
      autoprint: false,
      snapToGrid: true,
      showGrid: true,
    });
    handleUspsUserIdChange('');
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

          {/* USPS Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">USPS Integration</h3>
            <div className="space-y-2">
              <Label 
                htmlFor="usps-user-id" 
                className="text-sm font-normal"
              >
                USPS Web Tools User ID
                <p className="text-xs text-muted-foreground mt-1">
                  Required for address validation. Get your free API key at{' '}
                  <a 
                    href="https://www.usps.com/business/web-tools-apis/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    USPS Web Tools <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </Label>
              <Input
                id="usps-user-id"
                value={uspsUserId}
                onChange={(e) => handleUspsUserIdChange(e.target.value)}
                placeholder="Enter your USPS User ID"
                className="h-9"
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
