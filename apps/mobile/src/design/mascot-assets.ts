import doingOkay from '../../assets/dashboard/health-doing-okay.svg';
import feelingLow from '../../assets/dashboard/health-feeling-low.svg';
import happy from '../../assets/mascot/dino-happy.svg';
import needsCare from '../../assets/dashboard/health-needs-care.svg';

/** Source artwork inventory, not a score model or an unknown-user default mood. */
export const mascotAssets = { needsCare, feelingLow, doingOkay, happy } as const;
export const mascotBounds = { width: 110, height: 110 } as const;
