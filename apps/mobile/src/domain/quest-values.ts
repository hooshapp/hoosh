/** Pure shared value guards; no transport, native module, account or React dependency. */
export const isQuestId = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 36 && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value);
export function isQuestDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== 10 ||
      !/^(?:20[2-9][0-9]|2100)-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}
