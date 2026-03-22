import crypto from 'crypto';
import nodemailer from 'nodemailer';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import User from '../models/User.js';

// ── Mailer ───────────────────────────────────────────────────
const createMailer = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Welcome email HTML (same style as password recovery) ─────
const buildWelcomeHTML = (unsubscribeUrl) => `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 50px 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">

        <div style="padding: 30px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                GLITCH GANG<span style="color: #00ff00;">.</span>
            </h1>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">NEWSLETTER ACTIVADO</p>
        </div>

        <div style="padding: 0 40px 40px 40px; text-align: center;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Gracias por suscribirte al newsletter de <strong>Glitch Gang</strong>.
                A partir de ahora recibiras un resumen diario con las noticias mas
                relevantes del ecosistema competitivo en Latinoamerica.
            </p>

            <div style="margin: 30px 0; background-color: #f4f4f4; border-radius: 8px; padding: 24px 20px; border: 1px dashed #cccccc; text-align: left;">
                <p style="color: #333; font-size: 14px; line-height: 1.8; margin: 0;">
                    <strong style="color: #000;">Lo que recibiras:</strong><br/>
                    &#8226; Noticias de MLBB, LoL, Valorant y Wild Rift<br/>
                    &#8226; Resultados de torneos y competitivos LATAM<br/>
                    &#8226; Resumen diario a las 8:00 AM<br/>
                    &#8226; Actualizaciones de equipos y jugadores destacados
                </p>
            </div>

            <p style="color: #999; font-size: 12px; line-height: 1.5;">
                Este correo es legitimo. Lo recibes porque te suscribiste voluntariamente
                al newsletter. Nunca enviaremos spam ni compartiremos tu correo con terceros.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 16px;">
                Si no solicitaste esta suscripcion, puedes
                <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">cancelarla aqui</a>.
            </p>
        </div>

        <div style="background-color: #000; padding: 15px; text-align: center;">
            <p style="color: #fff; font-size: 11px; margin: 0; opacity: 0.7;">
                &copy; ${new Date().getFullYear()} Glitch Gang Platform. Todos los derechos reservados.
            </p>
        </div>
    </div>
</div>
`;

// ── Send welcome email ───────────────────────────────────────
const sendWelcomeEmail = async (email, unsubscribeToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  try {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
    const unsubscribeUrl = `${backendUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
    const transporter = createMailer();

    await transporter.sendMail({
      from: `"Glitch Gang" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenido al Newsletter de Glitch Gang',
      html: buildWelcomeHTML(unsubscribeUrl),
    });

    console.log(`[Newsletter] Email de bienvenida enviado a ${email}`);
  } catch (err) {
    console.error(`[Newsletter] Error enviando bienvenida a ${email}:`, err.message);
  }
};

// ── Helper: find user by email (case-insensitive) ────────────
const findUserByEmail = (email) =>
  User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });

// ── POST /api/newsletter/subscribe ───────────────────────────
export const subscribe = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalido' });
    }

    const games = Array.isArray(req.body.games) && req.body.games.length
      ? req.body.games.map((g) => String(g).trim()).filter(Boolean)
      : ['MLBB', 'LoL', 'Valorant', 'Wild Rift'];

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      if (existing.active) {
        return res.json({ message: 'Ya estas suscrito!' });
      }
      existing.active = true;
      existing.games = games;
      await existing.save();

      await notifyUserSubscription(email, true);
      sendWelcomeEmail(email, existing.unsubscribeToken);

      return res.json({ message: 'Suscripcion reactivada!' });
    }

    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    await NewsletterSubscriber.create({ email, games, unsubscribeToken });

    await notifyUserSubscription(email, false);
    sendWelcomeEmail(email, unsubscribeToken);

    return res.status(201).json({ message: 'Suscrito correctamente!' });
  } catch (error) {
    console.error('newsletter subscribe error:', error);
    return res.status(500).json({ message: 'Error al suscribirse' });
  }
};

// ── GET /api/newsletter/unsubscribe?token=xxx ────────────────
export const unsubscribe = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token requerido' });

    const subscriber = await NewsletterSubscriber.findOne({ unsubscribeToken: token });
    if (!subscriber) {
      return res.status(404).json({ message: 'Suscripcion no encontrada' });
    }

    subscriber.active = false;
    await subscriber.save();

    const user = await findUserByEmail(subscriber.email);
    if (user) {
      user.notifications.push({
        type: 'info',
        category: 'system',
        title: 'Newsletter cancelado',
        source: 'Newsletter',
        message: 'Te has dado de baja del newsletter de Glitch Gang. Puedes volver a suscribirte desde la pagina de noticias.',
        status: 'unread',
        isSaved: false,
        isArchived: false,
        meta: { type: 'newsletter_unsubscribe' },
        visuals: { icon: 'bx-envelope', color: '#9aa4b2', glow: false },
        createdAt: new Date(),
      });
      await user.save();
    }

    return res.send(`
      <html><body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f9f9f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="max-width:420px;background:#fff;border-radius:12px;border:1px solid #eee;padding:40px;text-align:center;">
          <h1 style="color:#000;font-size:24px;font-weight:800;letter-spacing:1px;margin:0 0 8px;">GLITCH GANG<span style="color:#00ff00;">.</span></h1>
          <p style="color:#333;font-size:16px;margin:20px 0 8px;">Te has dado de baja del newsletter correctamente.</p>
          <p style="color:#999;font-size:13px;">Si fue un error, puedes volver a suscribirte desde la pagina de noticias.</p>
        </div>
      </body></html>
    `);
  } catch (error) {
    console.error('newsletter unsubscribe error:', error);
    return res.status(500).json({ message: 'Error al cancelar suscripcion' });
  }
};

// ── Helper: push notification to user on subscribe ───────────
const notifyUserSubscription = async (email, isReactivation) => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`[Newsletter] No se encontro usuario con email ${email} para notificacion in-app`);
      return;
    }

    user.notifications.push({
      type: 'success',
      category: 'system',
      title: isReactivation ? 'Newsletter reactivado' : 'Suscrito al Newsletter',
      source: 'Newsletter',
      message: isReactivation
        ? 'Tu suscripcion al newsletter ha sido reactivada. Recibiras noticias diarias de esports en tu correo y aqui.'
        : 'Te has suscrito al newsletter de Glitch Gang. Recibiras noticias diarias de esports en tu correo y en tu buzon de notificaciones.',
      status: 'unread',
      isSaved: false,
      isArchived: false,
      meta: { type: 'newsletter_subscribe' },
      visuals: { icon: 'bx-envelope', color: '#7CFF6B', glow: true },
      createdAt: new Date(),
    });

    await user.save();
    console.log(`[Newsletter] Notificacion in-app enviada a ${user.email}`);
  } catch (error) {
    console.error('Error notificando suscripcion in-app:', error.message);
  }
};
