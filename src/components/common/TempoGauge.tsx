import { useCallback, useRef } from 'react';

const MIN = 80;
const MAX = 240;
const CX = 100;
const CY = 105;
const R = 80;
const START_DEG = 210; // standard math angle for MIN
const SWEEP = 240;     // total degrees

function tempoToAngle(t: number) {
  return START_DEG - ((t - MIN) / (MAX - MIN)) * SWEEP;
}

function pt(angleDeg: number, r = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
}

const S = pt(START_DEG);
const E = pt(START_DEG - SWEEP);

const TICKS = [80, 100, 120, 140, 160, 180, 200, 220, 240];
const MAJOR = [80, 120, 160, 200, 240];

function arcPath(from: { x: number; y: number }, to: { x: number; y: number }, sweepDeg: number, r = R) {
  if (sweepDeg <= 0) return '';
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

function getColor(t: number) {
  const ratio = (t - MIN) / (MAX - MIN);
  if (ratio < 0.4) return '#30D158';
  if (ratio < 0.7) return '#FFD60A';
  return '#FF453A';
}

interface Props { value: number; onChange: (v: number) => void; }

export function TempoGauge({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const getT = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return value;
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left) * (200 / rect.width);
    const y = (clientY - rect.top) * (170 / rect.height);
    const dx = x - CX;
    const dy = -(y - CY);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let diff = START_DEG - angle;
    if (diff < -60) diff += 360;
    if (diff > SWEEP + 60) diff -= 360;
    diff = Math.max(0, Math.min(SWEEP, diff));
    return Math.round((MIN + (diff / SWEEP) * (MAX - MIN)) / 5) * 5;
  }, [value]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    onChange(getT(e.clientX, e.clientY));
    const move = (e2: MouseEvent) => { if (dragging.current) onChange(getT(e2.clientX, e2.clientY)); };
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    onChange(getT(t.clientX, t.clientY));
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    onChange(getT(t.clientX, t.clientY));
  };

  const needleAngle = tempoToAngle(value);
  const needlePt = pt(needleAngle, R - 8);
  const valueSweep = ((value - MIN) / (MAX - MIN)) * SWEEP;
  const valuePt = pt(tempoToAngle(value));
  const color = getColor(value);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 170"
      className="w-full max-w-[260px] mx-auto cursor-pointer select-none touch-none"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* Background arc */}
      <path
        d={arcPath(S, E, SWEEP)}
        fill="none"
        stroke="#2C2C2E"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Value arc */}
      {valueSweep > 0 && (
        <path
          d={arcPath(S, valuePt, valueSweep)}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}

      {/* Tick marks */}
      {TICKS.map((t) => {
        const ang = tempoToAngle(t);
        const inner = pt(ang, R - 18);
        const outer = pt(ang, R - 3);
        const label = pt(ang, R - 28);
        const isMajor = MAJOR.includes(t);
        return (
          <g key={t}>
            <line
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke={isMajor ? '#888' : '#444'}
              strokeWidth={isMajor ? 2 : 1}
              strokeLinecap="round"
            />
            {isMajor && (
              <text
                x={label.x} y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={7}
                fill="#666"
              >{t}</text>
            )}
          </g>
        );
      })}

      {/* Needle */}
      <line
        x1={CX} y1={CY}
        x2={needlePt.x} y2={needlePt.y}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Pivot */}
      <circle cx={CX} cy={CY} r={5} fill={color} />
      <circle cx={CX} cy={CY} r={2.5} fill="#000" />

      {/* BPM display */}
      <text x={CX} y={CY + 22} textAnchor="middle" fontSize={24} fontWeight="700" fill="#fff" fontFamily="system-ui">
        {value}
      </text>
      <text x={CX} y={CY + 33} textAnchor="middle" fontSize={8} fill="#666" fontFamily="system-ui" letterSpacing="2">
        BPM
      </text>

    </svg>
  );
}
