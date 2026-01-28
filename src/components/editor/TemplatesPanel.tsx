import { useState, useEffect } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Star, 
  StarOff, 
  Trash2, 
  FileText,
  Plus,
  Search,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTemplates, saveTemplate, deleteTemplate, setDefaultTemplate } from '@/lib/api';
import type { LabelTemplate as TemplateType } from '@/types/label';
import { useToast } from '@/hooks/use-toast';

// Mock templates for development (when API isn't available)
const MOCK_TEMPLATES: TemplateType[] = [
  {
    id: '1',
    name: 'Standard Item Label',
    description: 'Basic label with item name and QR code',
    usageType: 'item',
    isDefaultForItems: true,
    isDefaultForContainers: false,
    isFavorite: false,
    label: {
      id: 'template-1',
      name: 'Standard Item Label',
      size: { id: 'dymo-30334', partNumber: '30334', name: 'DYMO 30334', width: 2.25, height: 1.25, category: 'Multi-Purpose', description: '2¼" × 1¼" Medium' },
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function TemplatesPanel() {
  const { label, loadLabel } = useLabelEditorContext();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<TemplateType[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateUsageType, setNewTemplateUsageType] = useState<'item' | 'container' | 'both'>('both');

  // Load templates from API
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await getTemplates();
        if (data.length > 0) {
          setTemplates(data as TemplateType[]);
        }
      } catch (error) {
        // Use mock templates if API fails
        console.log('Using mock templates');
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the template",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newTemplate: TemplateType = {
        id: crypto.randomUUID(),
        name: newTemplateName,
        description: newTemplateDescription,
        label: { ...label },
        usageType: newTemplateUsageType,
        isDefaultForItems: false,
        isDefaultForContainers: false,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try to save to API
      try {
        await saveTemplate(newTemplate);
      } catch {
        // If API fails, just add locally
      }

      setTemplates(prev => [...prev, newTemplate]);
      setSaveDialogOpen(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      
      toast({
        title: "Template saved",
        description: `"${newTemplateName}" has been saved.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (template: TemplateType) => {
    loadLabel(template.label);
    toast({
      title: "Template loaded",
      description: `"${template.name}" is now active.`,
    });
  };

  const handleSetDefaultForItems = async (template: TemplateType) => {
    try {
      await setDefaultTemplate(template.id, 'item');
    } catch (err) {
      console.error('Failed to set default template:', err);
      toast({
        title: "Failed to set default",
        description: "Could not set this as the default item template.",
        variant: "destructive",
      });
      return;
    }

    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefaultForItems: t.id === template.id,
    })));
    
    toast({
      title: "Default item template set",
      description: `"${template.name}" will be used for new items.`,
    });
  };

  const handleSetDefaultForContainers = async (template: TemplateType) => {
    try {
      await setDefaultTemplate(template.id, 'container');
    } catch (err) {
      console.error('Failed to set default template:', err);
      toast({
        title: "Failed to set default",
        description: "Could not set this as the default container template.",
        variant: "destructive",
      });
      return;
    }

    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefaultForContainers: t.id === template.id,
    })));

    toast({
      title: "Default container template set",
      description: `"${template.name}" will be used for new containers.`,
    });
  };

  const handleDeleteTemplate = async (template: TemplateType) => {
    try {
      await deleteTemplate(template.id);
    } catch {
      // Continue even if API fails
    }

    setTemplates(prev => prev.filter(t => t.id !== template.id));
    
    toast({
      title: "Template deleted",
      description: `"${template.name}" has been removed.`,
    });
  };

  const toggleFavorite = (template: TemplateType) => {
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  return (
    <div className="border-t flex flex-col">
      {/* Header with Defaults Info */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Templates</h2>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save your current label design as a reusable template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="My Label Template"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="A brief description of this template..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Use For</Label>
                  <Select value={newTemplateUsageType} onValueChange={(val: any) => setNewTemplateUsageType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item">Items only</SelectItem>
                      <SelectItem value="container">Containers only</SelectItem>
                      <SelectItem value="both">Both items & containers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Defaults Info Bar */}
        <div className="text-xs space-y-1 p-2 bg-background rounded border">
          <div>
            <span className="font-medium text-muted-foreground">Item Default:</span>{' '}
            <span className="font-semibold">
              {templates.find(t => t.isDefaultForItems)?.name || 'None set'}
            </span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Container Default:</span>{' '}
            <span className="font-semibold">
              {templates.find(t => t.isDefaultForContainers)?.name || 'None set'}
            </span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Templates List */}
      <ScrollArea className="max-h-64">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No templates found</p>
              <p className="text-xs mt-1">Save your first template above</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleLoadTemplate(template)}
              >
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {template.name}
                      </span>
                      {template.isDefaultForItems && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Item Default
                        </Badge>
                      )}
                      {template.isDefaultForContainers && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Container Default
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Item Default Toggle Pill */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (template.isDefaultForItems) {
                          setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isDefaultForItems: false } : t));
                          toast({ title: "Item default cleared" });
                        } else {
                          handleSetDefaultForItems(template);
                        }
                      }}
                      title={template.isDefaultForItems ? "Clear item default" : "Set as item default"}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                        template.isDefaultForItems
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {template.isDefaultForItems && <Check className="h-3 w-3" />}
                      Item
                    </button>
                    {/* Container Default Toggle Pill */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (template.isDefaultForContainers) {
                          setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isDefaultForContainers: false } : t));
                          toast({ title: "Container default cleared" });
                        } else {
                          handleSetDefaultForContainers(template);
                        }
                      }}
                      title={template.isDefaultForContainers ? "Clear container default" : "Set as container default"}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                        template.isDefaultForContainers
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {template.isDefaultForContainers && <Check className="h-3 w-3" />}
                      Container
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template);
                      }}
                    >
                      {template.isFavorite ? (
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
