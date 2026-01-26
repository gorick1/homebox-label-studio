import { useRef, useEffect, useCallback, useState } from 'react';
import { useLabelEditorContext } from '@/contexts/LabelEditorContext';
import type { LabelElement, Position, Size } from '@/types/label';
import { cn } from '@/lib/utils';

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
  const {
    label,
    selectedElementId,
    setSelectedElementId,
    moveElement,
    resizeElement,
    zoom,
    showGrid,
    gridSize,
  } = useLabelEditorContext();

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
        ctx.fillStyle = `rgba(${element.color.r}, ${element.color.g}, ${element.color.b}, ${element.color.a / 255})`;
        ctx.font = `${element.font.italic ? 'italic ' : ''}${element.font.bold ? 'bold ' : ''}${element.font.size * scale}px ${element.font.family}`;
        ctx.textBaseline = 'top';
        
        // Word wrap text
        const words = element.content.split(' ');
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
        // Draw QR code placeholder
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(x, y, width, height);
        
        // Draw QR pattern placeholder
        ctx.fillStyle = '#1f2937';
        const cellSize = Math.min(width, height) / 10;
        const pattern = [
          [1, 1, 1, 1, 1, 1, 1, 0, 1],
          [1, 0, 0, 0, 0, 0, 1, 0, 0],
          [1, 0, 1, 1, 1, 0, 1, 0, 1],
          [1, 0, 1, 1, 1, 0, 1, 0, 0],
          [1, 0, 1, 1, 1, 0, 1, 0, 1],
          [1, 0, 0, 0, 0, 0, 1, 0, 0],
          [1, 1, 1, 1, 1, 1, 1, 0, 1],
          [0, 0, 0, 0, 0, 0, 0, 0, 0],
          [1, 0, 1, 0, 1, 0, 1, 0, 1],
        ];
        
        pattern.forEach((row, i) => {
          row.forEach((cell, j) => {
            if (cell) {
              ctx.fillRect(x + j * cellSize, y + i * cellSize, cellSize, cellSize);
            }
          });
        });

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
  }, [label, selectedElementId, canvasWidth, canvasHeight, showGrid, gridSize, inchesToPixels, scale]);

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
      className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-8"
    >
      <div 
        className="relative shadow-xl rounded-sm bg-white"
        style={{ 
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 rounded-sm",
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
