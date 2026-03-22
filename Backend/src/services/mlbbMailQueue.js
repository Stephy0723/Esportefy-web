import nodemailer from 'nodemailer';
import MlbbMailQueueJob from '../models/MlbbMailQueueJob.js';

const QUEUE_TYPE = 'mlbb_review_request';
const WORKER_ID = `mlbb-mail-worker:${process.pid}`;

let workerTimer = null;
let tickInProgress = false;

const parseBooleanEnv = (value, fallback = false) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
};

const parsePositiveIntEnv = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const isQueueEnabled = () => parseBooleanEnv(process.env.MLBB_EMAIL_QUEUE_ENABLED, true);
const getPollIntervalMs = () => parsePositiveIntEnv(process.env.MLBB_EMAIL_QUEUE_POLL_MS, 5000);
const getBatchSize = () => parsePositiveIntEnv(process.env.MLBB_EMAIL_QUEUE_BATCH_SIZE, 20);
const getLockTimeoutMs = () => parsePositiveIntEnv(process.env.MLBB_EMAIL_QUEUE_LOCK_TIMEOUT_MS, 90_000);
const getMaxAttempts = () => parsePositiveIntEnv(process.env.MLBB_EMAIL_QUEUE_MAX_ATTEMPTS, 5);

const getMlbbReviewInbox = () => {
  const inbox = String(process.env.MLBB_REVIEW_EMAIL || '').trim();
  if (inbox) return inbox;
  return String(process.env.EMAIL_USER || '').trim();
};

const smtpConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const createMailer = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

const buildHtml = (payload = {}) => `
  <div style="font-family:Arial,sans-serif;background:#0f1115;padding:24px;color:#e7eaf0;">
    <h2 style="margin:0 0 12px;color:#7CFF6B;">GlitchGang · Solicitud MLBB</h2>
    <p style="margin:0 0 8px;">Se recibió una nueva solicitud de verificación de Mobile Legends.</p>
    <ul style="line-height:1.7;">
      <li><strong>Usuario:</strong> ${payload.username || '-'}</li>
      <li><strong>Nombre:</strong> ${payload.fullName || '-'}</li>
      <li><strong>Email:</strong> ${payload.email || '-'}</li>
      <li><strong>User ID:</strong> ${payload.playerId || '-'}</li>
      <li><strong>Zone ID:</strong> ${payload.zoneId || '-'}</li>
      <li><strong>IGN:</strong> ${payload.ign || '-'}</li>
    </ul>
    <p style="margin-top:12px;font-size:12px;color:#9aa4b2;">Revisa y procesa la solicitud desde el panel/admin endpoint.</p>
  </div>
`;

const sendMlbbReviewMail = async (payload = {}) => {
  const inbox = getMlbbReviewInbox();
  if (!smtpConfigured() || !inbox) {
    throw new Error('SMTP o inbox de revisión MLBB no configurado');
  }

  const transporter = createMailer();
  const subject = `Nueva solicitud MLBB - ${payload.username || payload.fullName || payload.userId || 'usuario'}`;
  await transporter.sendMail({
    to: inbox,
    from: `"GlitchGang" <${process.env.EMAIL_USER}>`,
    subject,
    html: buildHtml(payload)
  });
};

const computeBackoffMs = (attempts) => {
  const base = 15_000;
  const exponential = base * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(exponential, 10 * 60_000);
};

const claimNextJob = async () => {
  const now = new Date();
  const staleLock = new Date(Date.now() - getLockTimeoutMs());
  return MlbbMailQueueJob.findOneAndUpdate(
    {
      type: QUEUE_TYPE,
      $or: [
        {
          status: 'pending',
          nextAttemptAt: { $lte: now },
          $or: [{ lockedAt: null }, { lockedAt: { $exists: false } }, { lockedAt: { $lte: staleLock } }]
        },
        {
          status: 'processing',
          lockedAt: { $lte: staleLock }
        }
      ]
    },
    {
      $set: {
        status: 'processing',
        lockedAt: now,
        lockedBy: WORKER_ID
      },
      $inc: { attempts: 1 }
    },
    { sort: { nextAttemptAt: 1, createdAt: 1 }, new: true }
  );
};

const processSingleJob = async (job) => {
  try {
    await sendMlbbReviewMail(job.payload || {});
    await MlbbMailQueueJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: 'delivered',
          deliveredAt: new Date(),
          lockedAt: null,
          lockedBy: '',
          lastError: ''
        }
      }
    );
    return { delivered: 1, retried: 0, failed: 0 };
  } catch (error) {
    const attempts = Number(job.attempts || 1);
    const maxAttempts = Number(job.maxAttempts || getMaxAttempts());
    const exhausted = attempts >= maxAttempts;
    const nextAttemptAt = new Date(Date.now() + computeBackoffMs(attempts));

    await MlbbMailQueueJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: exhausted ? 'failed' : 'pending',
          nextAttemptAt: exhausted ? job.nextAttemptAt : nextAttemptAt,
          lockedAt: null,
          lockedBy: '',
          lastError: String(error?.message || error)
        }
      }
    );

    return { delivered: 0, retried: exhausted ? 0 : 1, failed: exhausted ? 1 : 0 };
  }
};

export const enqueueMlbbReviewEmail = async (payload = {}) => {
  return MlbbMailQueueJob.create({
    type: QUEUE_TYPE,
    payload,
    status: 'pending',
    attempts: 0,
    maxAttempts: getMaxAttempts(),
    nextAttemptAt: new Date()
  });
};

export const processMlbbMailQueueOnce = async () => {
  if (!isQueueEnabled()) {
    return {
      enabled: false,
      smtpConfigured: smtpConfigured(),
      processed: 0,
      delivered: 0,
      retried: 0,
      failed: 0
    };
  }

  if (!smtpConfigured() || !getMlbbReviewInbox()) {
    return {
      enabled: true,
      smtpConfigured: false,
      processed: 0,
      delivered: 0,
      retried: 0,
      failed: 0
    };
  }

  let processed = 0;
  let delivered = 0;
  let retried = 0;
  let failed = 0;
  const batchSize = getBatchSize();

  for (let i = 0; i < batchSize; i += 1) {
    const job = await claimNextJob();
    if (!job) break;
    const result = await processSingleJob(job);
    processed += 1;
    delivered += result.delivered;
    retried += result.retried;
    failed += result.failed;
  }

  return {
    enabled: true,
    smtpConfigured: true,
    processed,
    delivered,
    retried,
    failed
  };
};

const safeTick = async () => {
  if (tickInProgress) return;
  tickInProgress = true;
  try {
    await processMlbbMailQueueOnce();
  } catch (error) {
    console.warn('Error procesando cola MLBB:', error?.message || error);
  } finally {
    tickInProgress = false;
  }
};

export const startMlbbMailQueueWorker = () => {
  if (workerTimer || process.env.NODE_ENV === 'test') return;
  if (!isQueueEnabled()) return;

  const pollMs = getPollIntervalMs();
  workerTimer = setInterval(safeTick, pollMs);
  if (typeof workerTimer.unref === 'function') workerTimer.unref();
  safeTick().catch(() => {});
};

export const getMlbbMailQueueStatus = async () => {
  const [counts, pendingDue, oldestPending] = await Promise.all([
    MlbbMailQueueJob.aggregate([
      { $match: { type: QUEUE_TYPE } },
      { $group: { _id: '$status', total: { $sum: 1 } } }
    ]),
    MlbbMailQueueJob.countDocuments({
      type: QUEUE_TYPE,
      status: 'pending',
      nextAttemptAt: { $lte: new Date() }
    }),
    MlbbMailQueueJob.findOne({ type: QUEUE_TYPE, status: 'pending' })
      .sort({ nextAttemptAt: 1 })
      .select('nextAttemptAt createdAt attempts')
  ]);

  const byStatus = { pending: 0, processing: 0, delivered: 0, failed: 0 };
  for (const row of counts) {
    if (row?._id && Object.prototype.hasOwnProperty.call(byStatus, row._id)) {
      byStatus[row._id] = row.total;
    }
  }

  return {
    enabled: isQueueEnabled(),
    workerRunning: Boolean(workerTimer),
    smtpConfigured: smtpConfigured(),
    inboxConfigured: Boolean(getMlbbReviewInbox()),
    pollIntervalMs: getPollIntervalMs(),
    batchSize: getBatchSize(),
    maxAttempts: getMaxAttempts(),
    byStatus,
    pendingDue,
    oldestPending: oldestPending
      ? {
          nextAttemptAt: oldestPending.nextAttemptAt,
          createdAt: oldestPending.createdAt,
          attempts: oldestPending.attempts
        }
      : null
  };
};
