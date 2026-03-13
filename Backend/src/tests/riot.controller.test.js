import axios from 'axios';
import bcrypt from 'bcryptjs';
import {
  confirmRiotLink,
  unlinkRiotAccount,
  valorantRsoCallback
} from '../controllers/riot.controller.js';
import User from '../models/User.js';
import { consumeOAuthState } from '../services/oauthStateStore.js';

jest.mock('axios');
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true)
  }))
}));
jest.mock('../models/User.js');
jest.mock('../services/oauthStateStore.js', () => ({
  createOAuthState: jest.fn(),
  consumeOAuthState: jest.fn()
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.redirectUrl = '';
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.redirect = jest.fn((url) => {
    res.redirectUrl = url;
    return res;
  });
  return res;
};

const mockFindOneSelect = (value) => {
  User.findOne.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(value)
  }));
};

describe('Riot controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.RIOT_RSO_CLIENT_ID = 'riot-client';
    process.env.RIOT_RSO_CLIENT_SECRET = 'riot-secret';
    process.env.RIOT_RSO_REDIRECT_URI = 'http://localhost:3000/api/auth/riot/valorant/callback';
  });

  test('confirmRiotLink vincula y crea notificación del usuario', async () => {
    const userDoc = {
      _id: 'u1',
      connections: {
        riot: {
          pendingLink: {
            otpHash: 'hashed-otp',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            puuid: 'puuid-1',
            gameName: 'Angel',
            tagLine: 'LAN'
          }
        }
      },
      gameProfiles: {},
      save: jest.fn().mockResolvedValue(true)
    };

    User.findById.mockResolvedValue(userDoc);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mockFindOneSelect(null);
    bcrypt.compare.mockResolvedValue(true);
    axios.get.mockRejectedValue({ response: { status: 404 } });

    const req = {
      userId: 'u1',
      body: { otp: '123456' }
    };
    const res = createRes();

    await confirmRiotLink(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.message).toBe('Riot vinculado correctamente');
    expect(userDoc.connections.riot.verified).toBe(true);
    expect(userDoc.connections.riot.pendingLink).toBeUndefined();
    expect(userDoc.save).toHaveBeenCalled();
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      expect.objectContaining({
        $push: expect.objectContaining({
          notifications: expect.objectContaining({
            $each: [
              expect.objectContaining({
                title: 'Cuenta Riot vinculada',
                category: 'riot'
              })
            ]
          })
        })
      })
    );
  });

  test('unlinkRiotAccount limpia conexión y genera notificación', async () => {
    User.findById.mockImplementationOnce(() => ({
      select: jest.fn().mockResolvedValue({
        connections: {
          riot: {
            verified: true,
            puuid: 'puuid-1',
            gameName: 'Angel',
            tagLine: 'LAN'
          }
        }
      })
    }));
    User.findByIdAndUpdate.mockResolvedValue(true);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const req = { userId: 'u1' };
    const res = createRes();

    await unlinkRiotAccount(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.message).toBe('Riot desvinculado');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      $unset: {
        'connections.riot': '',
        'gameProfiles.lol': '',
        'gameProfiles.valorant': ''
      }
    });
    expect(User.updateOne).toHaveBeenCalled();
  });

  test('valorantRsoCallback autoriza VALORANT y notifica al usuario', async () => {
    const idTokenPayload = Buffer.from(JSON.stringify({ sub: 'rso-subject-1' })).toString('base64url');
    const userDoc = {
      _id: 'u1',
      connections: {},
      gameProfiles: {},
      save: jest.fn().mockResolvedValue(true)
    };

    consumeOAuthState.mockResolvedValue({ userId: 'u1' });
    User.findById.mockResolvedValue(userDoc);
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });
    mockFindOneSelect(null);
    axios.post.mockResolvedValue({
      data: {
        access_token: 'access-token-1',
        id_token: `a.${idTokenPayload}.c`,
        scope: 'openid offline_access'
      }
    });
    axios.get
      .mockResolvedValueOnce({
        data: {
          puuid: 'puuid-1',
          gameName: 'Angel',
          tagLine: 'LAN'
        }
      })
      .mockRejectedValue({ response: { status: 404 } });

    const req = {
      query: {
        code: 'oauth-code',
        state: 'state-1'
      }
    };
    const res = createRes();

    await valorantRsoCallback(req, res);

    expect(userDoc.connections.riot.products.valorant.consentGranted).toBe(true);
    expect(userDoc.save).toHaveBeenCalled();
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      expect.objectContaining({
        $push: expect.objectContaining({
          notifications: expect.objectContaining({
            $each: [
              expect.objectContaining({
                title: 'VALORANT autorizado',
                category: 'riot'
              })
            ]
          })
        })
      })
    );
    expect(String(res.redirectUrl || '')).toContain('oauthProvider=riot');
    expect(String(res.redirectUrl || '')).toContain('oauthStatus=connected');
  });
});
