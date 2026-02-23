import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';

describe('Error handling middleware', () => {
  const app = createApp();

  it('returns 404 JSON for unknown routes', async () => {
    const res = await app.request('/nonexistent-route-xyz');
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Route not found');
    expect(body.status).toBe(404);
  });
});
