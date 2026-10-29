import doingOkay from '../../assets/mascot/dino-doing-okay.svg';
import feelingLow from '../../assets/mascot/dino-feeling-low.svg';
import happy from '../../assets/mascot/dino-happy.svg';
import needsCare from '../../assets/mascot/dino-needs-care.svg';

/** Source artwork inventory, not a score model or an unknown-user default mood. */
export const mascotAssets = { needsCare, feelingLow, doingOkay, happy } as const;
export const mascotBounds = { width: 110, height: 110 } as const;
