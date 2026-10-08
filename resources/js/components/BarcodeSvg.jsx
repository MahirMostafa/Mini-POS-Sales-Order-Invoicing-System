import React, { useMemo } from 'react';

// Code128 B Patterns (ASCII 32 ' ' to 127) + Start/Stop symbols
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (104=Start B, 106=Stop)
];

const START_B = 104;
const STOP = 106;

export default function BarcodeSvg({ 
  value = '', 
  height = 44, 
  showText = true, 
  className = '', 
  barColor = '#0f172a' 
}) {
  const { bars, viewBoxWidth } = useMemo(() => {
    const text = String(value || '').trim();
    if (!text) {
      return { bars: [], viewBoxWidth: 100 };
    }

    // Convert chars to Code128 indices (ASCII - 32)
    const codes = [];
    let checksum = START_B;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) - 32;
      const validCode = code >= 0 && code <= 95 ? code : 0;
      codes.push(validCode);
      checksum += validCode * (i + 1);
    }

    const checkDigit = checksum % 103;
    const allSymbols = [START_B, ...codes, checkDigit, STOP];

    // Build the bar sequence (1 = black bar, 0 = white space)
    const barElements = [];
    let currentX = 10; // Left quiet zone

    allSymbols.forEach((symIndex) => {
      const pattern = CODE128_PATTERNS[symIndex] || "211214";
      for (let p = 0; p < pattern.length; p++) {
        const width = parseInt(pattern[p], 10);
        const isBar = p % 2 === 0;
        if (isBar) {
          barElements.push({ x: currentX, width });
        }
        currentX += width;
      }
    });

    currentX += 10; // Right quiet zone

    return {
      bars: barElements,
      viewBoxWidth: currentX,
    };
  }, [value]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className="w-full max-w-[260px] h-auto overflow-visible"
        style={{ minHeight: `${height}px` }}
        shapeRendering="crispEdges"
      >
        <rect width={viewBoxWidth} height={height} fill="transparent" />
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            fill={barColor}
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-bold text-slate-800 tracking-[3px] mt-1">
          {value}
        </span>
      )}
    </div>
  );
}
