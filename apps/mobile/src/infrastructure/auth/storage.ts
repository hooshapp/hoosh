/** Platform storage errors must lock the safe projection, never silently fall back. */
export function guardedAuthStorage(
  storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> },
  failed: () => void,
) {
  return {
    async getItem(key: string) { try { return await storage.getItem(key); } catch { failed(); throw new Error('Secure session storage is unavailable.'); } },
    async setItem(key: string, value: string) { try { await storage.setItem(key, value); } catch { failed(); throw new Error('Secure session storage is unavailable.'); } },
    async removeItem(key: string) { try { await storage.removeItem(key); } catch { failed(); throw new Error('Secure session storage is unavailable.'); } },
  };
}
