import { afterEach, describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { requireEpicOAuthConfig } from '../controllers/platformOAuth.controller.js';

const ORIGINAL_EPIC_ENV = {
  EPIC_CLIENT_ID: process.env.EPIC_CLIENT_ID,
  EPIC_CLIENT_SECRET: process.env.EPIC_CLIENT_SECRET,
  EPIC_REDIRECT_URI: process.env.EPIC_REDIRECT_URI
};

const buildApp = () => {
  const app = express();
  app.post('/api/auth/epic/start', requireEpicOAuthConfig, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
};

describe('Platform OAuth config middleware', () => {
  afterEach(() => {
    if (typeof ORIGINAL_EPIC_ENV.EPIC_CLIENT_ID === 'undefined') delete process.env.EPIC_CLIENT_ID;
    else process.env.EPIC_CLIENT_ID = ORIGINAL_EPIC_ENV.EPIC_CLIENT_ID;

    if (typeof ORIGINAL_EPIC_ENV.EPIC_CLIENT_SECRET === 'undefined') delete process.env.EPIC_CLIENT_SECRET;
    else process.env.EPIC_CLIENT_SECRET = ORIGINAL_EPIC_ENV.EPIC_CLIENT_SECRET;

    if (typeof ORIGINAL_EPIC_ENV.EPIC_REDIRECT_URI === 'undefined') delete process.env.EPIC_REDIRECT_URI;
    else process.env.EPIC_REDIRECT_URI = ORIGINAL_EPIC_ENV.EPIC_REDIRECT_URI;
  });

  it('returns 503 when Epic OAuth config is incomplete', async () => {
    delete process.env.EPIC_CLIENT_ID;
    delete process.env.EPIC_CLIENT_SECRET;
    delete process.env.EPIC_REDIRECT_URI;

    const response = await request(buildApp()).post('/api/auth/epic/start');

    expect(response.status).toBe(503);
    expect(response.body.message).toContain('Epic Games OAuth no está configurado');
  });

  it('allows the request when Epic OAuth config is present', async () => {
    process.env.EPIC_CLIENT_ID = 'epic-client-id';
    process.env.EPIC_CLIENT_SECRET = 'epic-client-secret';
    process.env.EPIC_REDIRECT_URI = 'https://glitchgang.net/api/auth/epic/callback';

    const response = await request(buildApp()).post('/api/auth/epic/start');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
