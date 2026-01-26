import { useLabelEditorContext } from '@/contexts/LabelEditorContext';

const PPI = 96; // Pixels per inch

export default function CanvasRulers() {
  const { label, zoom } = useLabelEditorContext();
  
  const scale = zoom / 100;
  const width = label.size.width * PPI * scale;
  const height = label.size.height * PPI * scale;
  
  // Calculate ruler tick marks
  const tickSpacing = 0.25; // Quarter inch marks
  const majorTickSpacing = 1; // Full inch marks
  
  const horizontalTicks = [];
  const verticalTicks = [];
  
  for (let i = 0; i <= label.size.width; i += tickSpacing) {
    const isMajor = i % majorTickSpacing === 0;
    horizontalTicks.push({ position: i * PPI * scale, value: i, isMajor });
  }
  
  for (let i = 0; i <= label.size.height; i += tickSpacing) {
    const isMajor = i % majorTickSpacing === 0;
    verticalTicks.push({ position: i * PPI * scale, value: i, isMajor });
  }

  return (
    <>
      {/* Horizontal ruler (top) */}
      <div 
        className="absolute left-8 top-0 h-6 bg-muted/50 border-b overflow-hidden"
        style={{ width }}
      >
        {horizontalTicks.map((tick, idx) => (
          <div
            key={idx}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: tick.position }}
          >
            <div 
              className={`w-px bg-muted-foreground/50 ${tick.isMajor ? 'h-4' : 'h-2'}`}
            />
            {tick.isMajor && (
              <span className="text-[9px] text-muted-foreground mt-0.5">
                {tick.value}"
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vertical ruler (left) */}
      <div 
        className="absolute left-0 top-6 w-6 bg-muted/50 border-r overflow-hidden"
        style={{ height }}
      >
        {verticalTicks.map((tick, idx) => (
          <div
            key={idx}
            className="absolute left-0 flex items-center"
            style={{ top: tick.position }}
          >
            <div 
              className={`h-px bg-muted-foreground/50 ${tick.isMajor ? 'w-4' : 'w-2'}`}
            />
            {tick.isMajor && (
              <span className="text-[9px] text-muted-foreground ml-0.5 -rotate-90 origin-left translate-y-1">
                {tick.value}"
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Corner square */}
      <div className="absolute left-0 top-0 w-6 h-6 bg-muted/50 border-b border-r" />
    </>
  );
}
