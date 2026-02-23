import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('GET /version', () => {
  const app = createApp();

  it('returns 200 with version info', async () => {
    const res = await app.request('/version');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.version).toBe('string');
    expect(body.name).toBe('notification-dispatcher');
  });
});
