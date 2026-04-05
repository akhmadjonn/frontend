'use client';

import type { SignConfig } from '../../types';

export default function SignSvg({ type, position, value }: SignConfig) {
  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Post with shadow */}
      <rect x={0} y={0} width={2} height={14} fill="#999" rx={0.5} />
      <rect x={-0.5} y={0} width={1} height={14} fill="#777" rx={0.5} />

      {type === 'stop' && <StopSign />}
      {type === 'yield' && <YieldSign />}
      {(type === 'main_road' || type === 'priority') && <MainRoadSign />}
      {type === 'railway' && <RailwaySign />}
      {type === 'pedestrian_crossing' && <PedestrianCrossingSign />}
      {type === 'speed_limit' && <SpeedLimitSign value={value} />}
      {type === 'no_overtaking' && <NoOvertakingSign />}
    </g>
  );
}

function StopSign() {
  // Octagonal STOP sign
  const r = 10;
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 8) + (i * Math.PI) / 4;
    return `${Math.cos(angle) * r},${-8 + Math.sin(angle) * r}`;
  }).join(' ');

  return (
    <g>
      {/* Shadow */}
      <polygon points={points} fill="rgba(0,0,0,0.15)" transform="translate(1,1)" />
      {/* Main shape */}
      <polygon points={points} fill="#CC0000" stroke="white" strokeWidth={1.2} />
      {/* Inner border */}
      <polygon points={Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI / 8) + (i * Math.PI) / 4;
        return `${Math.cos(angle) * (r - 2)},${-8 + Math.sin(angle) * (r - 2)}`;
      }).join(' ')} fill="none" stroke="white" strokeWidth={0.4} />
      <text x={0} y={-5.5} textAnchor="middle" fontSize={6} fontWeight="900" fill="white" fontFamily="Arial, sans-serif">
        STOP
      </text>
    </g>
  );
}

function YieldSign() {
  return (
    <g>
      {/* Shadow */}
      <polygon points="0,4 -10,-12 10,-12" fill="rgba(0,0,0,0.15)" transform="translate(1,1)" />
      {/* White background */}
      <polygon points="0,4 -10,-12 10,-12" fill="white" stroke="#CC0000" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Inner red border */}
      <polygon points="0,1 -7,-10 7,-10" fill="none" stroke="#CC0000" strokeWidth={0.5} />
    </g>
  );
}

function MainRoadSign() {
  return (
    <g>
      {/* Shadow */}
      <polygon points="0,-16 9,-7 0,2 -9,-7" fill="rgba(0,0,0,0.15)" transform="translate(1,1)" />
      {/* White border */}
      <polygon points="0,-16 9,-7 0,2 -9,-7" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
      {/* Yellow diamond */}
      <polygon points="0,-14 7,-7 0,0 -7,-7" fill="#FFD700" stroke="#E6C200" strokeWidth={0.3} />
    </g>
  );
}

function RailwaySign() {
  return (
    <g>
      {/* Warning triangle background */}
      <polygon points="0,-18 11,-1 -11,-1" fill="white" stroke="#CC0000" strokeWidth={2} strokeLinejoin="round" />
      {/* X cross for railway */}
      <line x1={-5} y1={-13} x2={5} y2={-5} stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
      <line x1={5} y1={-13} x2={-5} y2={-5} stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
      {/* Fence/barrier symbol */}
      <line x1={-4} y1={-4} x2={4} y2={-4} stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

function PedestrianCrossingSign() {
  return (
    <g>
      {/* Shadow */}
      <rect x={-9} y={-18} width={18} height={18} rx={2} fill="rgba(0,0,0,0.15)" transform="translate(1,1)" />
      {/* Blue background */}
      <rect x={-9} y={-18} width={18} height={18} rx={2} fill="#2962FF" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
      {/* White inner square */}
      <rect x={-7} y={-16} width={14} height={14} rx={1} fill="none" stroke="white" strokeWidth={0.6} />
      {/* Pedestrian figure */}
      {/* Head */}
      <circle cx={-1} cy={-13} r={2} fill="white" />
      {/* Body */}
      <line x1={-1} y1={-11} x2={-1} y2={-7} stroke="white" strokeWidth={1.5} strokeLinecap="round" />
      {/* Arms */}
      <line x1={-1} y1={-9.5} x2={-4} y2={-11} stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      <line x1={-1} y1={-9.5} x2={2} y2={-11} stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      {/* Legs */}
      <line x1={-1} y1={-7} x2={-3.5} y2={-4} stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      <line x1={-1} y1={-7} x2={1.5} y2={-4} stroke="white" strokeWidth={1.2} strokeLinecap="round" />
      {/* Zebra stripes */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={3} y={-15 + i * 3} width={3} height={1.8} rx={0.3} fill="white" opacity={0.8} />
      ))}
    </g>
  );
}

function SpeedLimitSign({ value }: { value?: number }) {
  return (
    <g>
      {/* Shadow */}
      <circle cx={1} cy={-8} r={10} fill="rgba(0,0,0,0.15)" />
      {/* White background */}
      <circle cx={0} cy={-8} r={10} fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth={0.3} />
      {/* Red border ring */}
      <circle cx={0} cy={-8} r={10} fill="none" stroke="#CC0000" strokeWidth={2.5} />
      {/* Inner white */}
      <circle cx={0} cy={-8} r={7} fill="white" />
      {/* Number */}
      <text x={0} y={-5} textAnchor="middle" fontSize={value && value >= 100 ? 8 : 10} fontWeight="900" fill="#1a1a1a" fontFamily="Arial, sans-serif">
        {value}
      </text>
    </g>
  );
}

function NoOvertakingSign() {
  return (
    <g>
      {/* Shadow */}
      <circle cx={1} cy={-8} r={10} fill="rgba(0,0,0,0.15)" />
      {/* White background */}
      <circle cx={0} cy={-8} r={10} fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth={0.3} />
      {/* Red border */}
      <circle cx={0} cy={-8} r={10} fill="none" stroke="#CC0000" strokeWidth={2.5} />
      {/* Red car (left) */}
      <rect x={-5.5} y={-13} width={4.5} height={9} rx={2} fill="#CC0000" />
      <rect x={-4.8} y={-11.5} width={3} height={2} rx={0.8} fill="rgba(200,230,255,0.5)" />
      {/* Black car (right) */}
      <rect x={1} y={-13} width={4.5} height={9} rx={2} fill="#1a1a1a" />
      <rect x={1.7} y={-11.5} width={3} height={2} rx={0.8} fill="rgba(200,230,255,0.5)" />
    </g>
  );
}
