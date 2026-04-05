'use client';

interface PedestrianSvgProps {
  x: number;
  y: number;
  direction: 'left' | 'right';
  walking?: boolean;
}

export default function PedestrianSvg({ x, y, direction, walking }: PedestrianSvgProps) {
  const flip = direction === 'left' ? -1 : 1;
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip}, 1)`}>
      {/* Shadow */}
      <ellipse cx={0} cy={11} rx={6} ry={2.5} fill="rgba(0,0,0,0.18)" />

      {/* Left leg */}
      <rect x={-2.8} y={3} width={2.8} height={9} rx={1.2} fill="#37474F">
        {walking && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-22,0,3;22,0,3;-22,0,3"
            dur="0.45s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      {/* Right leg */}
      <rect x={0.3} y={3} width={2.8} height={9} rx={1.2} fill="#455A64">
        {walking && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="22,0,3;-22,0,3;22,0,3"
            dur="0.45s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Shoes */}
      <ellipse cx={-1.5} cy={12} rx={2.2} ry={1.4} fill="#212121" />
      <ellipse cx={1.5} cy={12} rx={2.2} ry={1.4} fill="#212121" />

      {/* Body / torso */}
      <rect x={-4} y={-7} width={8} height={11} rx={3} fill="#1565C0" />
      {/* Jacket zipper */}
      <line x1={0} y1={-5} x2={0} y2={3} stroke="#0D47A1" strokeWidth={0.6} />

      {/* Left arm */}
      <rect x={-6} y={-6} width={2.8} height={7.5} rx={1.2} fill="#1976D2">
        {walking && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="20,-5,-3;-20,-5,-3;20,-5,-3"
            dur="0.45s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      {/* Right arm */}
      <rect x={3.2} y={-6} width={2.8} height={7.5} rx={1.2} fill="#1976D2">
        {walking && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-20,3,-3;20,3,-3;-20,3,-3"
            dur="0.45s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Hands */}
      <circle cx={-4.8} cy={2} r={1.5} fill="#FFCC80" />
      <circle cx={4.8} cy={2} r={1.5} fill="#FFCC80" />

      {/* Neck */}
      <rect x={-1.5} y={-9.5} width={3} height={3.5} rx={1} fill="#FFCC80" />

      {/* Head */}
      <circle cx={0} cy={-14} r={5} fill="#FFCC80" />
      {/* Hair */}
      <ellipse cx={0} cy={-17} rx={4.5} ry={3} fill="#4E342E" />
      <ellipse cx={-1.5} cy={-15.5} rx={5} ry={2.2} fill="#4E342E" />
      {/* Eye */}
      <circle cx={2.2} cy={-14} r={0.8} fill="#333" />
      {/* Mouth */}
      <line x1={1} y1={-12} x2={3} y2={-12} stroke="#BF8A60" strokeWidth={0.5} strokeLinecap="round" />
    </g>
  );
}
