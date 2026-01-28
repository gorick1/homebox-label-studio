import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Label, LabelElement, LabelSize, TextElement, QRCodeElement, BarcodeElement, Position, Size, HomeboxItem } from '@/types/label';
import { LABEL_SIZES } from '@/types/label';
import { substitutePlaceholders } from '@/lib/dymoFormat';
import { getSettings, saveSettings, type EditorSettings } from '@/lib/api';

const generateId = () => crypto.randomUUID();

const createDefaultLabel = (size: LabelSize = LABEL_SIZES[0]): Label => ({
  id: generateId(),
  name: 'Untitled Label',
  size,
  elements: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const DEFAULT_TEXT_ELEMENT: Omit<TextElement, 'id' | 'name' | 'position'> = {
  type: 'text',
  content: 'New Text',
  size: { width: 1, height: 0.25 },
  font: {
    family: 'Arial',
    size: 12,
    bold: false,
    italic: false,
    underline: false,
  },
  color: { r: 0, g: 0, b: 0, a: 255 },
  locked: false,
  visible: true,
};

const DEFAULT_QRCODE_ELEMENT: Omit<QRCodeElement, 'id' | 'name' | 'position'> = {
  type: 'qrcode',
  data: 'https://homebox.garrettorick.com/item/{item_id}',
  size: { width: 0.75, height: 0.75 },
  locked: false,
  visible: true,
};

const DEFAULT_BARCODE_ELEMENT: Omit<BarcodeElement, 'id' | 'name' | 'position'> = {
  type: 'barcode',
  data: '{item_id}',
  format: 'code128',
  showText: true,
  size: { width: 1.5, height: 0.4 },
  locked: false,
  visible: true,
};

interface HistoryState {
  past: Label[];
  present: Label;
  future: Label[];
}

export function useLabelEditor(initialLabel?: Label) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialLabel || createDefaultLabel(),
    future: [],
  });
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.125); // 1/8 inch
  const [previewItem, setPreviewItem] = useState<HomeboxItem | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(getSettings());

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettings(editorSettings);
  }, [editorSettings]);

  const label = history.present;

  // Create preview data map from the selected item
  const previewData = useMemo(() => {
    if (!previewItem) return null;
    return {
      '{item_name}': previewItem.name,
      '{location}': previewItem.location.path,
      '{quantity}': previewItem.quantity.toString(),
      '{item_id}': previewItem.id,
      '{asset_id}': previewItem.assetId,
      '{description}': previewItem.description,
      '{notes}': previewItem.notes,
    };
  }, [previewItem]);

  // Get display content for an element (with or without substitution)
  const getDisplayContent = useCallback((element: LabelElement): string => {
    if (!isPreviewMode || !previewData) {
      if (element.type === 'text') return element.content;
      if (element.type === 'qrcode') return element.data;
      if (element.type === 'barcode') return element.data;
      return '';
    }
    
    if (element.type === 'text') {
      return substitutePlaceholders(element.content, previewData);
    } else if (element.type === 'qrcode') {
      return substitutePlaceholders(element.data, previewData);
    } else if (element.type === 'barcode') {
      return substitutePlaceholders(element.data, previewData);
    }
    return '';
  }, [isPreviewMode, previewData]);

  const selectedElement = useMemo(() => {
    return label.elements.find(el => el.id === selectedElementId) || null;
  }, [label.elements, selectedElementId]);

  const updateLabel = useCallback((updater: (label: Label) => Label) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: updater({ ...prev.present, updatedAt: new Date().toISOString() }),
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  type TextPreset = {
    content: string;
    fontSize?: number;
    bold?: boolean;
    name?: string;
  };

  const addElement = useCallback((type: 'text' | 'qrcode' | 'barcode', preset?: TextPreset) => {
    const id = generateId();
    const position: Position = { x: 0.1, y: 0.1 };
    
    let newElement: LabelElement;
    
    if (type === 'text') {
      newElement = {
        ...DEFAULT_TEXT_ELEMENT,
        id,
        name: preset?.name || `Text ${label.elements.filter(e => e.type === 'text').length + 1}`,
        position,
        content: preset?.content || DEFAULT_TEXT_ELEMENT.content,
        font: {
          ...DEFAULT_TEXT_ELEMENT.font,
          size: preset?.fontSize || DEFAULT_TEXT_ELEMENT.font.size,
          bold: preset?.bold ?? DEFAULT_TEXT_ELEMENT.font.bold,
        },
      };
    } else if (type === 'qrcode') {
      newElement = {
        ...DEFAULT_QRCODE_ELEMENT,
        id,
        name: `QR Code ${label.elements.filter(e => e.type === 'qrcode').length + 1}`,
        position,
      };
    } else {
      newElement = {
        ...DEFAULT_BARCODE_ELEMENT,
        id,
        name: `Barcode ${label.elements.filter(e => e.type === 'barcode').length + 1}`,
        position,
      };
    }

    updateLabel(l => ({
      ...l,
      elements: [...l.elements, newElement],
    }));
    
    setSelectedElementId(id);
    return id;
  }, [label.elements, updateLabel]);

  const updateElement = useCallback((id: string, updates: Partial<LabelElement>) => {
    updateLabel(l => ({
      ...l,
      elements: l.elements.map(el => 
        el.id === id ? { ...el, ...updates } as LabelElement : el
      ),
    }));
  }, [updateLabel]);

  const deleteElement = useCallback((id: string) => {
    updateLabel(l => ({
      ...l,
      elements: l.elements.filter(el => el.id !== id),
    }));
    
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, updateLabel]);

  const duplicateElement = useCallback((id: string) => {
    const element = label.elements.find(el => el.id === id);
    if (!element) return;

    const newId = generateId();
    const newElement: LabelElement = {
      ...element,
      id: newId,
      name: `${element.name} Copy`,
      position: {
        x: element.position.x + 0.1,
        y: element.position.y + 0.1,
      },
    };

    updateLabel(l => ({
      ...l,
      elements: [...l.elements, newElement],
    }));
    
    setSelectedElementId(newId);
  }, [label.elements, updateLabel]);

  const moveElement = useCallback((id: string, position: Position) => {
    let finalPosition = position;
    
    if (snapToGrid) {
      finalPosition = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    }
    
    // Constrain to label bounds
    const element = label.elements.find(el => el.id === id);
    if (element) {
      finalPosition = {
        x: Math.max(0, Math.min(finalPosition.x, label.size.width - element.size.width)),
        y: Math.max(0, Math.min(finalPosition.y, label.size.height - element.size.height)),
      };
    }

    updateElement(id, { position: finalPosition });
  }, [snapToGrid, gridSize, label.elements, label.size, updateElement]);

  const resizeElement = useCallback((id: string, size: Size, position?: Position) => {
    const updates: Partial<LabelElement> = { size };
    if (position) {
      updates.position = position;
    }
    updateElement(id, updates);
  }, [updateElement]);

  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    updateLabel(l => {
      const elements = [...l.elements];
      const [removed] = elements.splice(fromIndex, 1);
      elements.splice(toIndex, 0, removed);
      return { ...l, elements };
    });
  }, [updateLabel]);

  const setLabelSize = useCallback((size: LabelSize) => {
    updateLabel(l => ({ ...l, size }));
  }, [updateLabel]);

  const setLabelName = useCallback((name: string) => {
    updateLabel(l => ({ ...l, name }));
  }, [updateLabel]);

  const loadLabel = useCallback((newLabel: Label) => {
    setHistory({
      past: [],
      present: newLabel,
      future: [],
    });
    setSelectedElementId(null);
  }, []);

  const resetLabel = useCallback((size?: LabelSize) => {
    setHistory({
      past: [],
      present: createDefaultLabel(size || label.size),
      future: [],
    });
    setSelectedElementId(null);
  }, [label.size]);

  return {
    // Label state
    label,
    selectedElement,
    selectedElementId,
    
    // Selection
    setSelectedElementId,
    
    // Element operations
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    resizeElement,
    reorderElements,
    
    // Label operations
    setLabelSize,
    setLabelName,
    loadLabel,
    resetLabel,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // View options
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    
    // Preview mode
    previewItem,
    setPreviewItem,
    isPreviewMode,
    setIsPreviewMode,
    previewData,
    getDisplayContent,
    
    // Editor settings
    editorSettings,
    setEditorSettings,
  };
}

export type LabelEditorState = ReturnType<typeof useLabelEditor>;
