import {
  validateMlbbId,
  linkMlbbAccount,
  mlbbOpsStatus,
  reviewMlbbLink
} from '../controllers/mlbb.controller.js';
import User from '../models/User.js';
import {
  enqueueMlbbReviewEmail,
  getMlbbMailQueueStatus
} from '../services/mlbbMailQueue.js';
import { recordAdminAudit } from '../services/auditLogger.js';

jest.mock('../models/User.js');
jest.mock('../services/mlbbMailQueue.js', () => ({
  enqueueMlbbReviewEmail: jest.fn(),
  getMlbbMailQueueStatus: jest.fn(),
  processMlbbMailQueueOnce: jest.fn()
}));
jest.mock('../services/auditLogger.js', () => ({
  recordAdminAudit: jest.fn()
}));

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const mockFindByIdSelect = (value) => {
  User.findById.mockImplementationOnce(() => ({
    select: jest.fn().mockResolvedValue(value)
  }));
};

const mockFindOneSelect = (value) => {
  User.findOne.mockImplementation(() => ({
    select: jest.fn().mockResolvedValue(value)
  }));
};

describe('MLBB controller hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MLBB_VERIFICATION_MODE = 'manual';
    process.env.MLBB_LINK_COOLDOWN_SECONDS = '90';
  });

  test('validateMlbbId responde 400 si los IDs son inválidos', async () => {
    const req = {
      body: { playerId: 'abc', zoneId: '1234' },
      userId: 'u1'
    };
    const res = createRes();

    await validateMlbbId(req, res);

    expect(res.statusCode).toBe(400);
    expect(String(res.body?.message || '').toLowerCase()).toContain('user id');
  });

  test('linkMlbbAccount en modo manual deja pending y encola correo', async () => {
    const userDoc = {
      _id: 'u1',
      username: 'angel',
      fullName: 'Angel',
      email: 'angel@mail.com',
      connections: {},
      gameProfiles: {},
      notifications: [],
      save: jest.fn().mockResolvedValue(true)
    };
    mockFindOneSelect(null);
    mockFindByIdSelect(userDoc);

    const req = {
      body: { playerId: '123456789', zoneId: '1234', ign: 'AngelML' },
      userId: 'u1'
    };
    const res = createRes();

    await linkMlbbAccount(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.status).toBe('pending');
    expect(enqueueMlbbReviewEmail).toHaveBeenCalledTimes(1);
    expect(userDoc.gameProfiles?.mlbb?.playerId).toBe('123456789');
    expect(userDoc.gameProfiles?.mlbb?.verificationStatus).toBe('pending');
    expect(Array.isArray(userDoc.notifications)).toBe(true);
    expect(userDoc.notifications[0]?.title).toBe('Solicitud MLBB enviada');
  });

  test('linkMlbbAccount aplica cooldown anti-spam en pending', async () => {
    mockFindOneSelect(null);
    mockFindByIdSelect({
      _id: 'u1',
      username: 'angel',
      fullName: 'Angel',
      email: 'angel@mail.com',
      connections: {
        mlbb: {
          verificationStatus: 'pending',
          reviewRequestedAt: new Date()
        }
      },
      save: jest.fn().mockResolvedValue(true)
    });

    const req = {
      body: { playerId: '123456789', zoneId: '1234', ign: 'AngelML' },
      userId: 'u1'
    };
    const res = createRes();

    await linkMlbbAccount(req, res);

    expect(res.statusCode).toBe(429);
    expect(String(res.body?.message || '').toLowerCase()).toContain('espera');
    expect(enqueueMlbbReviewEmail).not.toHaveBeenCalled();
  });

  test('mlbbOpsStatus solo admin y devuelve estado de cola', async () => {
    getMlbbMailQueueStatus.mockResolvedValue({
      enabled: true,
      workerRunning: true,
      byStatus: { pending: 2, processing: 0, delivered: 5, failed: 1 }
    });
    mockFindByIdSelect({ isAdmin: true });

    const req = { userId: 'admin' };
    const res = createRes();

    await mlbbOpsStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.queue?.enabled).toBe(true);
    expect(res.body?.queue?.byStatus?.pending).toBe(2);
  });

  test('reviewMlbbLink aprueba y sincroniza snapshot/notificación', async () => {
    const targetUser = {
      _id: 'user-target',
      username: 'angel',
      fullName: 'Angel',
      connections: {
        mlbb: {
          playerId: '123456789',
          zoneId: '1234',
          ign: 'AngelML',
          verificationStatus: 'pending',
          verified: false,
          riskFlags: ['too_many_attempts_24h']
        }
      },
      gameProfiles: {},
      notifications: [],
      save: jest.fn().mockResolvedValue(true)
    };

    mockFindByIdSelect({ isAdmin: true });
    mockFindByIdSelect(targetUser);
    mockFindOneSelect(null);

    const req = {
      params: { userId: 'user-target' },
      body: { action: 'approve' },
      userId: 'admin-1'
    };
    const res = createRes();

    await reviewMlbbLink(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.status).toBe('verified_manual');
    expect(targetUser.connections.mlbb.verified).toBe(true);
    expect(targetUser.gameProfiles?.mlbb?.verified).toBe(true);
    expect(targetUser.gameProfiles?.mlbb?.verificationStatus).toBe('verified_manual');
    expect(targetUser.notifications[0]?.title).toBe('Cuenta MLBB aprobada');
    expect(recordAdminAudit).toHaveBeenCalledTimes(1);
  });

  test('reviewMlbbLink rechaza y deja snapshot en rejected', async () => {
    const targetUser = {
      _id: 'user-target',
      username: 'angel',
      fullName: 'Angel',
      connections: {
        mlbb: {
          playerId: '123456789',
          zoneId: '1234',
          ign: 'AngelML',
          verificationStatus: 'pending',
          verified: false,
          riskFlags: ['retry_after_reject_too_soon']
        }
      },
      gameProfiles: {},
      notifications: [],
      save: jest.fn().mockResolvedValue(true)
    };

    mockFindByIdSelect({ isAdmin: true });
    mockFindByIdSelect(targetUser);

    const req = {
      params: { userId: 'user-target' },
      body: { action: 'reject', reason: 'IDs no coinciden con la evidencia.' },
      userId: 'admin-1'
    };
    const res = createRes();

    await reviewMlbbLink(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.status).toBe('rejected');
    expect(targetUser.connections.mlbb.verified).toBe(false);
    expect(targetUser.connections.mlbb.linkedAt).toBeNull();
    expect(targetUser.gameProfiles?.mlbb?.verificationStatus).toBe('rejected');
    expect(targetUser.notifications[0]?.title).toBe('Cuenta MLBB rechazada');
    expect(String(targetUser.notifications[0]?.message || '')).toContain('IDs no coinciden');
    expect(recordAdminAudit).toHaveBeenCalledTimes(1);
  });
});
