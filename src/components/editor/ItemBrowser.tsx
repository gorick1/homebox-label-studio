import { useState, useCallback } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Search, Package, MapPin, Hash, Eye, X, Loader2, AlertCircle } from 'lucide-react';
import type { HomeboxItem } from '@/types/label';
import { cn } from '@/lib/utils';

// Sample items for dev mode - these simulate what Homebox API would return
const SAMPLE_ITEMS: HomeboxItem[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Arduino Uno R3',
    description: 'Microcontroller board based on ATmega328P',
    location: { id: 'loc1', name: 'Electronics Shelf', path: 'Garage > Shelving > Electronics Shelf' },
    quantity: 3,
    assetId: 'ELEC-001',
    notes: 'Used for prototyping projects',
    customFields: {},
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Raspberry Pi 4 Model B',
    description: '4GB RAM single-board computer',
    location: { id: 'loc1', name: 'Electronics Shelf', path: 'Garage > Shelving > Electronics Shelf' },
    quantity: 2,
    assetId: 'ELEC-002',
    notes: 'Running Homebox and print services',
    customFields: {},
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    name: 'DYMO LabelWriter 450',
    description: 'Thermal label printer',
    location: { id: 'loc2', name: 'Desk', path: 'Office > Desk' },
    quantity: 1,
    assetId: 'OFFC-001',
    notes: 'Connected to Raspberry Pi for automatic printing',
    customFields: {},
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    name: '10K Ohm Resistor Pack',
    description: '100pcs 1/4W metal film resistors',
    location: { id: 'loc3', name: 'Component Drawers', path: 'Garage > Workbench > Component Drawers' },
    quantity: 87,
    assetId: 'COMP-001',
    notes: '',
    customFields: {},
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-567890123456',
    name: 'USB-C Cable 6ft',
    description: 'Braided USB-C to USB-C cable',
    location: { id: 'loc4', name: 'Cable Box', path: 'Office > Storage > Cable Box' },
    quantity: 5,
    assetId: 'CABL-001',
    notes: 'For charging and data transfer',
    customFields: {},
  },
];

interface ItemBrowserProps {
  onSelectItem: (item: HomeboxItem) => void;
  selectedItem: HomeboxItem | null;
}

function ItemCard({ 
  item, 
  isSelected, 
  onSelect, 
  onPreview 
}: { 
  item: HomeboxItem; 
  isSelected: boolean; 
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.location.path}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs shrink-0">
            <Hash className="h-3 w-3 mr-0.5" />
            {item.quantity}
          </Badge>
        </div>
      </div>
      
      {item.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {item.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-mono text-muted-foreground">
          {item.assetId}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="h-3 w-3" />
          Preview
        </Button>
      </div>
    </div>
  );
}

export default function ItemBrowser({ onSelectItem, selectedItem }: ItemBrowserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<HomeboxItem[]>(SAMPLE_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter items based on search query (client-side for dev mode)
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.assetId.toLowerCase().includes(query) ||
      item.location.path.toLowerCase().includes(query)
    );
  });

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setItems(SAMPLE_ITEMS);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In dev mode, just filter sample items
      // In production, this would call the Homebox API
      const filtered = SAMPLE_ITEMS.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.assetId.toLowerCase().includes(query)
        );
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setItems(filtered);
    } catch (err) {
      setError('Failed to search items. Make sure Homebox is accessible.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleSelectItem = (item: HomeboxItem) => {
    onSelectItem(item);
  };

  const handlePreviewItem = (item: HomeboxItem) => {
    onSelectItem(item);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          {selectedItem ? (
            <span className="max-w-[120px] truncate">{selectedItem.name}</span>
          ) : (
            'Browse Items'
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Homebox Items
          </SheetTitle>
          <SheetDescription>
            Select an item to preview your label with real data
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setItems(SAMPLE_ITEMS);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {/* Selected Item Preview */}
        {selectedItem && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Previewing:</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => onSelectItem(null as unknown as HomeboxItem)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm mt-1 truncate">{selectedItem.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{selectedItem.assetId}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Items List */}
        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          <div className="space-y-2 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No items found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={() => handleSelectItem(item)}
                  onPreview={() => handlePreviewItem(item)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-4 mt-2">
          <p className="text-xs text-muted-foreground text-center">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
            {selectedItem && ' • 1 selected for preview'}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
