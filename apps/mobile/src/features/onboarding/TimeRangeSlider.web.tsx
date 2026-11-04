import type { TimeRangeProps } from './TimeRangeSlider.types';
import { formatTime } from './manual-plan';

export function TimeRangeSlider({ start, end, onChange }: TimeRangeProps) {
  return <div style={{ position: 'relative', height: 44, margin: '2px 8px' }}>
    <style>{`.hoosh-time-range { appearance:none; -webkit-appearance:none; position:absolute; top:0; left:0; width:100%; height:44px; margin:0; background:transparent; pointer-events:none; }
.hoosh-time-range::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:22px; height:22px; border-radius:50%; border:3px solid #33C659; background:#FFFFFF; pointer-events:auto; cursor:grab; }
.hoosh-time-range::-moz-range-thumb { width:16px; height:16px; border-radius:50%; border:3px solid #33C659; background:#FFFFFF; pointer-events:auto; cursor:grab; }
.hoosh-time-range:focus-visible { outline:2px solid #33C659; outline-offset:2px; border-radius:4px; }`}</style>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 19, height: 6, borderRadius: 3, background: '#777777' }} />
    <div style={{ position: 'absolute', left: `${start / 1439 * 100}%`, right: `${100 - end / 1439 * 100}%`, top: 19, height: 6, background: '#33C659' }} />
    <input className="hoosh-time-range" type="range" aria-label="Start time slider" aria-valuetext={formatTime(start)} min={0} max={1439} step={1} value={start}
      onChange={event => onChange(Math.min(Number(event.target.value), end - 1), end)} />
    <input className="hoosh-time-range" type="range" aria-label="End time slider" aria-valuetext={formatTime(end)} min={0} max={1439} step={1} value={end}
      onChange={event => onChange(start, Math.max(Number(event.target.value), start + 1))} />
  </div>;
}
