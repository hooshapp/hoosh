// Same-tab navigation retains this tab's isolated PKCE verifier/session storage.
export async function openOAuthBrowser(url: string, _redirectUrl: string): Promise<string | null> {
  window.location.assign(url);
  // Navigation owns completion; do not clear pending intent before unloading.
  return new Promise(() => undefined);
}
