import { describe, expect, it } from 'vitest';
import { httpError } from './errors';
import { REQUEST_ID, failure, setup } from './__tests__/support';

function envelope(code: string, details: unknown, status = 422) {
  return {
    response: new Response('', { status, headers: { 'X-Request-ID': REQUEST_ID } }),
    body: {
      error: {
        code,
        message: 'PRIVATE_SERVER_COPY',
        request_id: REQUEST_ID,
        retryable: false,
        details,
      },
    },
  };
}
describe('settings safe error handoff', () => {
  it('decodes settings conflict without changing profile conflict behavior', () => {
    for (const code of ['SETTINGS_CONFLICT', 'PROFILE_CONFLICT']) {
      const { response, body } = envelope(code, { current_revision: 3 }, 409);
      const error = httpError(response, body, 0);
      expect(error).toMatchObject({
        kind: 'conflict',
        code,
        details: { current_revision: 3 },
        retryable: false,
      });
      expect(error.message).toContain(code === 'SETTINGS_CONFLICT' ? 'settings' : 'profile');
      expect(error.message).not.toContain('PRIVATE');
    }
  });
  it.each([
    ['activities.selected_activity_ids', 'duplicate'],
    ['activities.selected_activity_ids', 'invalid_choice'],
    ['activities.custom_text', 'blank'],
    ['plan_draft.weekdays', 'duplicate'],
    ['plan_draft.hours.start_local', 'invalid_time'],
    ['plan_draft.hours', 'invalid_range'],
    ['plan_draft.timezone_id', 'invalid_timezone'],
    ['plan_draft.session_count', 'out_of_range'],
    ['plan_draft.session_minutes', 'invalid_type'],
  ])('accepts the fixed field/code values %s/%s', (field, code) => {
    const { response, body } = envelope('VALIDATION_ERROR', { fields: [{ field, code }] });
    expect(httpError(response, body, 0)).toMatchObject({
      kind: 'validation',
      details: { fields: [{ field, code }] },
    });
  });
  it.each([
    { fields: [{ field: 'activities.PRIVATE_KEY', code: 'blank' }] },
    { fields: [{ field: 'plan_draft.hours', code: 'PRIVATE_CODE' }] },
    { fields: [] },
    { current_revision: '3' },
    { current_revision: -1 },
  ])('quarantines malformed settings error details %#', (details) => {
    const code = 'current_revision' in details ? 'SETTINGS_CONFLICT' : 'VALIDATION_ERROR';
    const { response, body } = envelope(code, details, code === 'SETTINGS_CONFLICT' ? 409 : 422);
    expect(httpError(response, body, 0)).toMatchObject({
      kind: 'invalid_response',
      details: undefined,
    });
  });
  it('never replays a settings conflict and forwards only safe metadata', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(failure(409, 'SETTINGS_CONFLICT', { current_revision: 2 }));
    await expect(
      app.api.request('/v1/settings', {
        method: 'PATCH',
        json: { expected_revision: 0, activities: null },
        decode: () => null,
      }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      code: 'SETTINGS_CONFLICT',
      requestMayHaveCommitted: false,
    });
    expect(app.fetcher).toHaveBeenCalledTimes(1);
  });
  it('marks a lost settings write response unconfirmed without automatic retry', async () => {
    const app = setup();
    app.fetcher.mockRejectedValue(new TypeError('PRIVATE_NETWORK_COPY'));
    await expect(
      app.api.request('/v1/settings', {
        method: 'PATCH',
        json: { expected_revision: 0, plan_draft: null },
        decode: () => null,
      }),
    ).rejects.toMatchObject({ kind: 'network', requestMayHaveCommitted: true });
    expect(app.fetcher).toHaveBeenCalledTimes(1);
    expect(app.auth.port.revalidateSession).not.toHaveBeenCalled();
  });
});
