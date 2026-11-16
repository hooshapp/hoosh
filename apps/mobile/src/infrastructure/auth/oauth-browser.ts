import * as WebBrowser from 'expo-web-browser';
export async function openOAuthBrowser(url: string, redirectUrl: string): Promise<string | null> {
  const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
  return result.type === 'success' ? result.url : null;
}
