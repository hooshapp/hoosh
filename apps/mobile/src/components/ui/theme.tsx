import { createContext, useContext, type PropsWithChildren } from 'react';

import { uiRecipes, type UiTheme } from '@/design/tokens';

const UiThemeContext = createContext<UiTheme>('warm');

/** Local presentation only: no account, product or device state belongs here. */
export function UiThemeProvider({ theme, children }: PropsWithChildren<{ theme: UiTheme }>) {
  return <UiThemeContext.Provider value={theme}>{children}</UiThemeContext.Provider>;
}

export function useUiTheme() {
  return uiRecipes[useContext(UiThemeContext)];
}
