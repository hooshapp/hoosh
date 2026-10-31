import back from '../../assets/icons/historydetail/back.svg';
import progressDots from '../../assets/icons/historydetail/progressDots.svg';
import next from '../../assets/icons/historydetail/next.svg';
import reclaimedDots from '../../assets/icons/historydetail/reclaimedDots.svg';
import freedLegend from '../../assets/icons/historydetail/freedLegend.svg';
import remainingLegend from '../../assets/icons/historydetail/remainingLegend.svg';
import freedCircle from '../../assets/icons/historydetail/freedCircle.svg';
import remainingCircle from '../../assets/icons/historydetail/remainingCircle.svg';

export const historydetailAssets = {
  back: { source: back, width: 16, height: 16 },
  progressDots: { source: progressDots, width: 30, height: 8 },
  next: { source: next, width: 20, height: 20 },
  reclaimedDots: { source: reclaimedDots, width: 30, height: 8 },
  freedLegend: { source: freedLegend, width: 10, height: 10 },
  remainingLegend: { source: remainingLegend, width: 10, height: 10 },
  freedCircle: { source: freedCircle, width: 60.0695, height: 59 },
  remainingCircle: { source: remainingCircle, width: 60.0695, height: 59 },
} as const;
