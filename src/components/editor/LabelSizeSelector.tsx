import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LABEL_SIZES, LABEL_CATEGORIES, type LabelSize } from '@/types/label';

interface LabelSizeSelectorProps {
  value: LabelSize;
  onValueChange: (size: LabelSize) => void;
}

export default function LabelSizeSelector({ value, onValueChange }: LabelSizeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Group labels by category
  const groupedLabels = useMemo(() => {
    const groups: Record<string, LabelSize[]> = {};
    
    for (const category of LABEL_CATEGORIES) {
      const labelsInCategory = LABEL_SIZES.filter(
        size => size.category === category
      );
      if (labelsInCategory.length > 0) {
        groups[category] = labelsInCategory;
      }
    }
    
    return groups;
  }, []);

  // Filter labels based on search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedLabels;
    
    const searchLower = search.toLowerCase();
    const filtered: Record<string, LabelSize[]> = {};
    
    for (const [category, labels] of Object.entries(groupedLabels)) {
      const matchingLabels = labels.filter(label => {
        const searchableText = [
          label.partNumber,
          label.name,
          label.category,
          label.description,
          `${label.width}`,
          `${label.height}`,
          `${label.width}" x ${label.height}"`,
          `${label.width}x${label.height}`,
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchLower);
      });
      
      if (matchingLabels.length > 0) {
        filtered[category] = matchingLabels;
      }
    }
    
    return filtered;
  }, [groupedLabels, search]);

  const handleSelect = (labelId: string) => {
    const selectedLabel = LABEL_SIZES.find(size => size.id === labelId);
    if (selectedLabel) {
      onValueChange(selectedLabel);
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-52 justify-between h-8 bg-background/50 border-border/50"
        >
          <div className="flex items-center gap-2 truncate">
            <Ruler className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-sm">
              {value.partNumber === 'Custom' 
                ? `Custom (${value.width}" × ${value.height}")`
                : `${value.partNumber} (${value.width}" × ${value.height}")`
              }
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border shadow-elevation-lg" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search by part #, size, or category..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            <CommandEmpty>No label size found.</CommandEmpty>
            {Object.entries(filteredGroups).map(([category, labels]) => (
              <CommandGroup key={category} heading={category}>
                {labels.map((label) => (
                  <CommandItem
                    key={label.id}
                    value={label.id}
                    onSelect={handleSelect}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value.id === label.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-primary">
                          {label.partNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {label.width}" × {label.height}"
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {label.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
