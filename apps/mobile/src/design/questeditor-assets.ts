import back from '../../assets/icons/questeditor/back.svg';
import interest from '../../assets/icons/questeditor/interest.svg';
import pencil from '../../assets/icons/questeditor/pencil.svg';
import calendar from '../../assets/icons/questeditor/calendar.svg';
import time from '../../assets/icons/questeditor/time.svg';
import timer from '../../assets/icons/questeditor/timer.svg';
import duration from '../../assets/icons/questeditor/duration.svg';
import repeat from '../../assets/icons/questeditor/repeat.svg';
import lock from '../../assets/icons/questeditor/lock.svg';
import check from '../../assets/icons/questeditor/check.svg';

export const questeditorAssets = {
  back: { source: back, width: 20, height: 20 },
  interest: { source: interest, width: 12, height: 12 },
  pencil: { source: pencil, width: 16, height: 16 },
  calendar: { source: calendar, width: 16, height: 16 },
  time: { source: time, width: 16, height: 16 },
  timer: { source: timer, width: 17, height: 17 },
  duration: { source: duration, width: 14, height: 14 },
  repeat: { source: repeat, width: 14, height: 14 },
  lock: { source: lock, width: 13, height: 13 },
  check: { source: check, width: 18, height: 18 },
} as const;
