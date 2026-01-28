import { useRef, useEffect, useCallback, useState } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import type { LabelElement, Position, Size } from '@/types/label';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// Scale: pixels per inch for display
const PPI = 96;

interface ResizeHandle {
  cursor: string;
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { cursor: 'nwse-resize', position: 'nw' },
  { cursor: 'ns-resize', position: 'n' },
  { cursor: 'nesw-resize', position: 'ne' },
  { cursor: 'ew-resize', position: 'e' },
  { cursor: 'nwse-resize', position: 'se' },
  { cursor: 'ns-resize', position: 's' },
  { cursor: 'nesw-resize', position: 'sw' },
  { cursor: 'ew-resize', position: 'w' },
];

export default function LabelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrCache, setQrCache] = useState<Map<string, HTMLCanvasElement>>(new Map());
  const {
    label,
    selectedElementId,
    setSelectedElementId,
    moveElement,
    resizeElement,
    deleteElement,
    zoom,
    showGrid,
    gridSize,
    isPreviewMode,
    getDisplayContent,
  } = useLabelEditorContext();

  // Keyboard delete handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      
      // Don't handle if user is typing in an input
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || 
          activeElement?.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement)?.isContentEditable) return;
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteElement(selectedElementId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, deleteElement]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle['position'] | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; elementX: number; elementY: number } | null>(null);
  const [resizeStart, setResizeStart] = useState<{ 
    x: number; y: number; 
    elementX: number; elementY: number;
    elementWidth: number; elementHeight: number;
  } | null>(null);

  const scale = zoom / 100;
  const canvasWidth = label.size.width * PPI * scale;
  const canvasHeight = label.size.height * PPI * scale;

  const inchesToPixels = useCallback((inches: number) => inches * PPI * scale, [scale]);
  const pixelsToInches = useCallback((pixels: number) => pixels / (PPI * scale), [scale]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      
      const gridPixels = inchesToPixels(gridSize);
      
      for (let x = gridPixels; x < canvasWidth; x += gridPixels) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      
      for (let y = gridPixels; y < canvasHeight; y += gridPixels) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    }

    // Draw elements
    label.elements.forEach((element) => {
      if (!element.visible) return;

      const x = inchesToPixels(element.position.x);
      const y = inchesToPixels(element.position.y);
      const width = inchesToPixels(element.size.width);
      const height = inchesToPixels(element.size.height);

      if (element.type === 'text') {
        const displayContent = getDisplayContent(element);
        ctx.fillStyle = `rgba(${element.color.r}, ${element.color.g}, ${element.color.b}, ${element.color.a / 255})`;
        ctx.font = `${element.font.italic ? 'italic ' : ''}${element.font.bold ? 'bold ' : ''}${element.font.size * scale}px ${element.font.family}`;
        ctx.textBaseline = 'top';
        
        // Word wrap text
        const words = displayContent.split(' ');
        let line = '';
        let lineY = y;
        const lineHeight = element.font.size * scale * 1.2;
        
        words.forEach((word) => {
          const testLine = line + (line ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > width && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, x, lineY);
      } else if (element.type === 'qrcode') {
        // Get QR code data and render cached version if available
        const displayData = getDisplayContent(element);
        const cacheKey = `${element.id}-${displayData}`;
        
        if (qrCache.has(cacheKey)) {
          // Use cached QR code canvas
          const qrCanvas = qrCache.get(cacheKey)!;
          ctx.drawImage(qrCanvas, x, y, width, height);
        } else {
          // Fallback to placeholder while QR generates
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(x, y, width, height);
          ctx.fillStyle = '#d1d5db';
          ctx.font = `${12 * scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('QR', x + width / 2, y + height / 2);
          ctx.textAlign = 'left';
        }

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
      } else if (element.type === 'barcode') {
        const displayData = getDisplayContent(element);
        // Draw barcode background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, width, height);
        
        // Draw barcode lines (Code128-style pattern)
        ctx.fillStyle = '#1f2937';
        const barcodeHeight = element.showText ? height * 0.75 : height;
        const barWidth = width / 50;
        
        // Generate a pseudo-random but consistent pattern based on data
        const data = displayData || 'barcode';
        for (let i = 0; i < 50; i++) {
          const charCode = data.charCodeAt(i % data.length) || 65;
          const shouldDraw = (charCode + i) % 3 !== 0;
          const isThick = (charCode + i) % 5 === 0;
          
          if (shouldDraw) {
            ctx.fillRect(
              x + i * barWidth, 
              y, 
              isThick ? barWidth * 1.5 : barWidth * 0.8, 
              barcodeHeight
            );
          }
        }
        
        // Draw data text below barcode if showText is true
        if (element.showText) {
          ctx.fillStyle = '#1f2937';
          ctx.font = `${10 * scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(displayData, x + width / 2, y + height);
          ctx.textAlign = 'left';
        }

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
      }

      // Draw selection border
      if (element.id === selectedElementId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);

        // Draw resize handles
        const handleSize = 8;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;

        const handles = [
          { x: x - handleSize / 2, y: y - handleSize / 2 }, // nw
          { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2 }, // n
          { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // ne
          { x: x + width - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // e
          { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // se
          { x: x + width / 2 - handleSize / 2, y: y + height - handleSize / 2 }, // s
          { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // sw
          { x: x - handleSize / 2, y: y + height / 2 - handleSize / 2 }, // w
        ];

        handles.forEach((handle) => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
      }
    });
  }, [label, selectedElementId, canvasWidth, canvasHeight, showGrid, gridSize, inchesToPixels, scale, isPreviewMode, getDisplayContent, qrCache]);

  // Generate QR codes asynchronously
  useEffect(() => {
    const generateQRCodes = async () => {
      const qrElements = label.elements.filter(el => el.type === 'qrcode');
      
      for (const element of qrElements) {
        const displayData = getDisplayContent(element);
        const cacheKey = `${element.id}-${displayData}`;
        
        // Skip if already cached
        if (qrCache.has(cacheKey)) continue;
        
        try {
          // Generate QR code as canvas
          const size = Math.max(inchesToPixels(element.size.width), inchesToPixels(element.size.height));
          const qrCanvas = await QRCode.toCanvas(displayData, {
            width: Math.min(size, 500),
            margin: 0,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          
          // Cache the canvas
          const newCache = new Map(qrCache);
          newCache.set(cacheKey, qrCanvas);
          setQrCache(newCache);
        } catch (err) {
          console.error('Failed to generate QR code:', err);
        }
      }
    };
    
    generateQRCodes();
  }, [label.elements, getDisplayContent, inchesToPixels, qrCache]);

  const getElementAtPoint = useCallback((x: number, y: number): LabelElement | null => {
    const posInches: Position = {
      x: pixelsToInches(x),
      y: pixelsToInches(y),
    };

    // Check elements in reverse order (top-most first)
    for (let i = label.elements.length - 1; i >= 0; i--) {
      const el = label.elements[i];
      if (!el.visible) continue;

      if (
        posInches.x >= el.position.x &&
        posInches.x <= el.position.x + el.size.width &&
        posInches.y >= el.position.y &&
        posInches.y <= el.position.y + el.size.height
      ) {
        return el;
      }
    }
    return null;
  }, [label.elements, pixelsToInches]);

  const getResizeHandleAtPoint = useCallback((x: number, y: number): ResizeHandle['position'] | null => {
    if (!selectedElementId) return null;

    const element = label.elements.find(el => el.id === selectedElementId);
    if (!element) return null;

    const handleSize = 12; // Slightly larger hit area
    const ex = inchesToPixels(element.position.x);
    const ey = inchesToPixels(element.position.y);
    const ew = inchesToPixels(element.size.width);
    const eh = inchesToPixels(element.size.height);

    const handlePositions: { pos: ResizeHandle['position']; x: number; y: number }[] = [
      { pos: 'nw', x: ex, y: ey },
      { pos: 'n', x: ex + ew / 2, y: ey },
      { pos: 'ne', x: ex + ew, y: ey },
      { pos: 'e', x: ex + ew, y: ey + eh / 2 },
      { pos: 'se', x: ex + ew, y: ey + eh },
      { pos: 's', x: ex + ew / 2, y: ey + eh },
      { pos: 'sw', x: ex, y: ey + eh },
      { pos: 'w', x: ex, y: ey + eh / 2 },
    ];

    for (const handle of handlePositions) {
      if (
        Math.abs(x - handle.x) <= handleSize / 2 &&
        Math.abs(y - handle.y) <= handleSize / 2
      ) {
        return handle.pos;
      }
    }
    return null;
  }, [selectedElementId, label.elements, inchesToPixels]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for resize handle first
    const handle = getResizeHandleAtPoint(x, y);
    if (handle && selectedElementId) {
      const element = label.elements.find(el => el.id === selectedElementId);
      if (element) {
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStart({
          x,
          y,
          elementX: element.position.x,
          elementY: element.position.y,
          elementWidth: element.size.width,
          elementHeight: element.size.height,
        });
        return;
      }
    }

    // Check for element click
    const element = getElementAtPoint(x, y);
    if (element) {
      setSelectedElementId(element.id);
      setIsDragging(true);
      setDragStart({
        x,
        y,
        elementX: element.position.x,
        elementY: element.position.y,
      });
    } else {
      setSelectedElementId(null);
    }
  }, [getElementAtPoint, getResizeHandleAtPoint, selectedElementId, label.elements, setSelectedElementId]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && dragStart && selectedElementId) {
      const deltaX = pixelsToInches(x - dragStart.x);
      const deltaY = pixelsToInches(y - dragStart.y);
      
      moveElement(selectedElementId, {
        x: dragStart.elementX + deltaX,
        y: dragStart.elementY + deltaY,
      });
    } else if (isResizing && resizeStart && resizeHandle && selectedElementId) {
      const deltaX = pixelsToInches(x - resizeStart.x);
      const deltaY = pixelsToInches(y - resizeStart.y);

      let newX = resizeStart.elementX;
      let newY = resizeStart.elementY;
      let newWidth = resizeStart.elementWidth;
      let newHeight = resizeStart.elementHeight;

      // Handle resize based on which handle is being dragged
      switch (resizeHandle) {
        case 'nw':
          newX = resizeStart.elementX + deltaX;
          newY = resizeStart.elementY + deltaY;
          newWidth = resizeStart.elementWidth - deltaX;
          newHeight = resizeStart.elementHeight - deltaY;
          break;
        case 'n':
          newY = resizeStart.elementY + deltaY;
          newHeight = resizeStart.elementHeight - deltaY;
          break;
        case 'ne':
          newY = resizeStart.elementY + deltaY;
          newWidth = resizeStart.elementWidth + deltaX;
          newHeight = resizeStart.elementHeight - deltaY;
          break;
        case 'e':
          newWidth = resizeStart.elementWidth + deltaX;
          break;
        case 'se':
          newWidth = resizeStart.elementWidth + deltaX;
          newHeight = resizeStart.elementHeight + deltaY;
          break;
        case 's':
          newHeight = resizeStart.elementHeight + deltaY;
          break;
        case 'sw':
          newX = resizeStart.elementX + deltaX;
          newWidth = resizeStart.elementWidth - deltaX;
          newHeight = resizeStart.elementHeight + deltaY;
          break;
        case 'w':
          newX = resizeStart.elementX + deltaX;
          newWidth = resizeStart.elementWidth - deltaX;
          break;
      }

      // Minimum size constraints
      const minSize = 0.1;
      if (newWidth >= minSize && newHeight >= minSize) {
        resizeElement(selectedElementId, 
          { width: newWidth, height: newHeight },
          { x: newX, y: newY }
        );
      }
    } else {
      // Update cursor based on what's under the mouse
      const handle = getResizeHandleAtPoint(x, y);
      if (handle) {
        const handleData = RESIZE_HANDLES.find(h => h.position === handle);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = handleData?.cursor || 'default';
        }
      } else if (getElementAtPoint(x, y)) {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'move';
        }
      } else {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeHandle, selectedElementId, pixelsToInches, moveElement, resizeElement, getResizeHandleAtPoint, getElementAtPoint]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeStart(null);
    setResizeHandle(null);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex items-center justify-center canvas-pattern overflow-auto p-8 relative"
    >
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-card/80 glass-panel text-xs font-medium text-muted-foreground shadow-elevation-md">
        {zoom}%
      </div>
      
      <div 
        className="relative shadow-elevation-xl rounded-lg bg-card overflow-hidden ring-1 ring-border/50"
        style={{ 
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0",
            isDragging && "cursor-grabbing",
          )}
          style={{ 
            width: canvasWidth,
            height: canvasHeight,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
