import nodemailer from 'nodemailer';
import News from '../models/News.js';
import User from '../models/User.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const createMailer = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Static fallback news (when DB has no recent articles) ───
const STATIC_NEWS = [
  {
    id: 1,
    title: 'ITLA domina la Copa Universitaria Popular 2025 ganando tres disciplinas',
    excerpt: 'ITLA eSports se consagro campeon en League of Legends, Valorant y Smash Bros Ultimate en la Copa Popular celebrada en Sambil, Santo Domingo.',
    category: 'Torneos',
    game: 'Multigame',
    image: 'https://images.unsplash.com/photo-1603810379657-7c147e6406a3?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Claro Gaming 2023 rompe records con mas de 3,000 jugadores',
    excerpt: 'La edicion 2023 de Claro Gaming se convirtio en el torneo de esports mas grande del Caribe.',
    category: 'Torneos',
    game: 'Multigame',
    image: 'https://images.unsplash.com/photo-1576990049702-8418081b420e?q=80&w=1400&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'MenaRD hace historia como bicampeon de Capcom Cup',
    excerpt: 'Saul "MenaRD" Mena se convierte en el primer y unico bicampeon de Capcom Cup.',
    category: 'Competitivo',
    game: 'Multigame',
    image: 'https://images.unsplash.com/photo-1569409611450-fd401daea0f8?q=80&w=1400&auto=format&fit=crop',
  },
  {
    id: 11,
    title: 'ISKRA representa a RD en Mobile Legends en el IESF WEC 2025',
    excerpt: 'El equipo ISKRA clasifico como seleccion dominicana de MLBB para el IESF WEC25.',
    category: 'Competitivo',
    game: 'MLBB',
    image: 'https://images.unsplash.com/photo-1558008258-ec20a83db196?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 9,
    title: 'Sonix conquista GENESIS X3 y reafirma su legado en Smash Bros',
    excerpt: 'Carlos "Sonix" Perez gana GENESIS X3, sumando otro major tras su titulo en CEO 2022.',
    category: 'Competitivo',
    game: 'Multigame',
    image: 'https://images.unsplash.com/photo-1548003693-b55d51032288?q=80&w=1400&auto=format&fit=crop',
  },
];

// ── Game colors ──────────────────────────────────────────────
const GAME_COLORS = {
  MLBB:        '#FF6B35',
  LoL:         '#C8AA6E',
  Valorant:    '#FF4655',
  'Wild Rift': '#00D4AA',
  Multigame:   '#7CFF6B',
};

const GAME_LABELS = {
  MLBB:        'Mobile Legends',
  LoL:         'League of Legends',
  Valorant:    'VALORANT',
  'Wild Rift': 'Wild Rift',
  Multigame:   'Multigame',
};

// ── Build daily newsletter HTML (white/clean style) ──────────
const buildNewsletterHTML = (articles, unsubscribeUrl, baseUrl) => {
  const today = new Date().toLocaleDateString('es-LA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const articleCards = articles.map((article) => {
    const gameColor = GAME_COLORS[article.game] || '#333';
    const gameLabel = GAME_LABELS[article.game] || article.game;
    const articleUrl = `${baseUrl}/noticias/${article._id || article.id}`;
    const imageHtml = article.image && !article.image.startsWith('data:')
      ? `<img src="${article.image}" alt="${article.title}" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px 8px 0 0;" />`
      : '';

    return `
      <div style="background:#f4f4f4;border-radius:8px;overflow:hidden;margin-bottom:14px;border:1px solid #eee;">
        ${imageHtml}
        <div style="padding:14px 16px;">
          <div style="display:inline-block;background:${gameColor}18;color:${gameColor};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;margin-bottom:6px;">
            ${gameLabel} · ${article.category || 'Torneos'}
          </div>
          <h3 style="margin:6px 0 4px;color:#000;font-size:15px;line-height:1.3;">
            <a href="${articleUrl}" style="color:#000;text-decoration:none;">${article.title}</a>
          </h3>
          <p style="margin:0 0 10px;color:#666;font-size:13px;line-height:1.5;">
            ${article.excerpt || ''}
          </p>
          <a href="${articleUrl}" style="color:#00cc00;font-size:13px;font-weight:600;text-decoration:none;">
            Leer mas →
          </a>
        </div>
      </div>
    `;
  }).join('');

  return `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 0;">
    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">

        <div style="padding: 30px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                GLITCH GANG<span style="color: #00ff00;">.</span>
            </h1>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">RESUMEN DIARIO DE ESPORTS</p>
            <p style="color: #999; font-size: 12px; margin-top: 4px;">${today}</p>
        </div>

        <div style="padding: 0 32px;">
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Aqui tienes las noticias mas recientes sobre torneos de esports
                en Latinoamerica. MLBB, LoL, Valorant y Wild Rift — todo lo que necesitas saber.
            </p>

            ${articleCards}
        </div>

        <div style="padding: 24px 32px; text-align: center;">
            <a href="${baseUrl}/noticias" style="display:inline-block;background:#000;color:#fff;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">
                Ver todas las noticias
            </a>
        </div>

        <div style="padding: 0 32px 20px;">
            <p style="color: #999; font-size: 11px; text-align: center; line-height: 1.5;">
                Recibes este correo porque te suscribiste al newsletter de Glitch Gang.
                Solo enviamos contenido de esports. Sin spam, sin terceros.
            </p>
        </div>

        <div style="background-color: #000; padding: 15px; text-align: center;">
            <p style="color: #fff; font-size: 11px; margin: 0 0 6px; opacity: 0.7;">
                &copy; ${new Date().getFullYear()} Glitch Gang Platform. Todos los derechos reservados.
            </p>
            <a href="${unsubscribeUrl}" style="color: #999; font-size: 11px; text-decoration: underline;">
                Cancelar suscripcion
            </a>
        </div>
    </div>
</div>
  `;
};

// ── Send newsletter to one subscriber ────────────────────────
const sendToSubscriber = async (transporter, subscriber, articles, baseUrl) => {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  const unsubscribeUrl = `${backendUrl}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;

  const relevantArticles = articles.filter(
    (a) => subscriber.games.includes(a.game) || a.game === 'Multigame'
  );

  if (!relevantArticles.length) return false;

  const html = buildNewsletterHTML(relevantArticles.slice(0, 8), unsubscribeUrl, baseUrl);

  await transporter.sendMail({
    from: `"Glitch Gang" <${process.env.EMAIL_USER}>`,
    to: subscriber.email,
    subject: 'Glitch Gang — Noticias de Esports LATAM del dia',
    html,
  });

  return true;
};

// ── Push in-app notification to registered users ─────────────
const pushNewsNotificationsToUsers = async (articles) => {
  try {
    const subscriberEmails = await NewsletterSubscriber.find({ active: true })
      .select('email games')
      .lean();

    if (!subscriberEmails.length) return 0;

    // Build a map of subscriber emails → games (lowercased for matching)
    const emailToGames = new Map(
      subscriberEmails.map((s) => [s.email.toLowerCase(), s.games])
    );

    // Case-insensitive search for users whose email matches any subscriber
    const users = await User.find({
      email: { $in: [...emailToGames.keys()].map((e) => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
    }).select('email notifications');

    if (!users.length) return 0;

    const topArticles = articles.slice(0, 3);
    let notified = 0;

    for (const user of users) {
      const userGames = emailToGames.get(user.email.toLowerCase()) || [];

      const relevant = topArticles.filter(
        (a) => userGames.includes(a.game) || a.game === 'Multigame'
      );

      if (!relevant.length) continue;

      const titles = relevant.map((a) => a.title);
      const firstArticle = relevant[0];

      user.notifications.push({
        type: 'info',
        category: 'system',
        title: 'Noticias del dia — Glitch Gang',
        source: 'Newsletter',
        message: titles.length === 1
          ? firstArticle.title
          : `${firstArticle.title} y ${titles.length - 1} noticia${titles.length - 1 > 1 ? 's' : ''} mas`,
        status: 'unread',
        isSaved: false,
        isArchived: false,
        meta: {
          newsIds: relevant.map((a) => a._id || a.id),
          type: 'newsletter_digest',
        },
        visuals: { icon: 'bx-news', color: '#7CFF6B', glow: true },
        createdAt: new Date(),
      });

      await user.save();
      notified++;
    }

    return notified;
  } catch (error) {
    console.error('[Newsletter] Error enviando notificaciones in-app:', error.message);
    return 0;
  }
};

// ── Main: send daily newsletter ──────────────────────────────
export const sendDailyNewsletter = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Newsletter] SMTP no configurado, omitiendo envio de correos');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const since = new Date(Date.now() - TWENTY_FOUR_HOURS);
    let articles = await News.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (!articles.length) {
      console.log('[Newsletter] No hay noticias nuevas en las ultimas 24h, usando noticias estaticas');
      articles = STATIC_NEWS;
    }

    const subscribers = await NewsletterSubscriber.find({ active: true }).lean();
    if (!subscribers.length) {
      console.log('[Newsletter] No hay suscriptores activos');
      return;
    }

    // 1) Send emails
    let emailsSent = 0;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = createMailer();
      const BATCH_SIZE = 10;
      for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(sub => sendToSubscriber(transporter, sub, articles, frontendUrl))
        );
        emailsSent += results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.filter(r => r.status === 'rejected');
        for (const f of failed) {
          console.error(`[Newsletter] Error enviando:`, f.reason?.message || f.reason);
        }
      }
    }

    // 2) Push in-app notifications
    const notified = await pushNewsNotificationsToUsers(articles);

    console.log(`[Newsletter] Enviados ${emailsSent}/${subscribers.length} correos, ${notified} notificaciones in-app`);
  } catch (error) {
    console.error('[Newsletter] Error general:', error);
  }
};

// ── Notify subscribers when a new article is published ───────
export const notifySubscribersNewArticle = async (article) => {
  try {
  const hasSmtp = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  console.log(`[Newsletter] hasSmtp=${!!hasSmtp}, EMAIL_USER=${process.env.EMAIL_USER ? 'SET' : 'UNSET'}`);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
  const articleUrl = `${frontendUrl}/noticias/${article._id || article.id}`;
  const gameColor = GAME_COLORS[article.game] || '#333';
  const gameLabel = GAME_LABELS[article.game] || article.game;

  const subscribers = await NewsletterSubscriber.find({ active: true }).lean();
  if (!subscribers.length) {
    console.log('[Newsletter] No hay suscriptores activos para notificar');
    return;
  }

  console.log(`[Newsletter] Notificando ${subscribers.length} suscriptores sobre: "${article.title}"`);

  // 1) Send emails
  let sent = 0;
  if (hasSmtp) {
    const transporter = createMailer();
    for (const sub of subscribers) {
      if (!sub.games.includes(article.game) && article.game !== 'Multigame') continue;

      const unsubscribeUrl = `${backendUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;

      const imageHtml = article.image && !article.image.startsWith('data:')
        ? `<img src="${article.image}" alt="${article.title}" style="width:100%;max-height:260px;object-fit:cover;display:block;" />`
        : '';

      const html = `
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#f9f9f9;padding:50px 0;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #eee;overflow:hidden;">
    <div style="padding:30px;text-align:center;">
      <h1 style="color:#000;margin:0;font-size:24px;font-weight:800;letter-spacing:1px;">
        GLITCH GANG<span style="color:#00ff00;">.</span>
      </h1>
      <p style="color:#666;font-size:14px;margin-top:10px;">NUEVA NOTICIA PUBLICADA</p>
    </div>
    ${imageHtml}
    <div style="padding:24px 32px 32px;text-align:center;">
      <div style="display:inline-block;background:${gameColor}18;color:${gameColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:12px;">
        ${gameLabel} · ${article.category || 'Noticias'}
      </div>
      <h2 style="color:#000;font-size:20px;font-weight:700;margin:12px 0 8px;line-height:1.3;">
        ${article.title}
      </h2>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        ${article.excerpt || ''}
      </p>
      <a href="${articleUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 32px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">
        Leer noticia completa
      </a>
    </div>
    <div style="padding:0 32px 16px;">
      <p style="color:#999;font-size:11px;text-align:center;">
        Recibes este correo porque estas suscrito al newsletter de Glitch Gang.
        <a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Cancelar suscripcion</a>
      </p>
    </div>
    <div style="background:#000;padding:15px;text-align:center;">
      <p style="color:#fff;font-size:11px;margin:0;opacity:0.7;">
        &copy; ${new Date().getFullYear()} Glitch Gang Platform. Todos los derechos reservados.
      </p>
    </div>
  </div>
</div>`;

    try {
      await transporter.sendMail({
        from: `"Glitch Gang" <${process.env.EMAIL_USER}>`,
        to: sub.email,
        subject: `Nueva noticia: ${article.title}`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[Newsletter] Error notificando a ${sub.email}:`, err.message);
    }
  }
  } else {
    console.warn('[Newsletter] SMTP no configurado, solo se enviaran notificaciones in-app');
  }

  // 2) Push in-app notifications
  const emailToGames = new Map(subscribers.map((s) => [s.email.toLowerCase(), s.games]));
  const users = await User.find({
    email: { $in: [...emailToGames.keys()].map((e) => new RegExp(`^${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
  }).select('email notifications');

  for (const user of users) {
    const userGames = emailToGames.get(user.email.toLowerCase()) || [];
    if (!userGames.includes(article.game) && article.game !== 'Multigame') continue;

    user.notifications.push({
      type: 'info',
      category: 'system',
      title: 'Nueva noticia publicada',
      source: 'Newsletter',
      message: article.title,
      status: 'unread',
      isSaved: false,
      isArchived: false,
      meta: { newsId: article._id, type: 'new_article' },
      visuals: { icon: 'bx-news', color: '#7CFF6B', glow: true },
      createdAt: new Date(),
    });
    await user.save();
  }

  console.log(`[Newsletter] Noticia "${article.title}" enviada a ${sent} suscriptores por email`);
  } catch (error) {
    console.error('[Newsletter] Error general en notifySubscribersNewArticle:', error.message, error.stack);
  }
};

// ── Scheduler: run every 24 hours at 8:00 AM ────────────────
export const startNewsletterScheduler = () => {
  console.log('[Newsletter] Scheduler iniciado — envio cada 24h a las 8:00 AM');

  const now = new Date();
  const next8am = new Date(now);
  next8am.setHours(8, 0, 0, 0);
  if (next8am <= now) next8am.setDate(next8am.getDate() + 1);

  const msUntil8am = next8am.getTime() - now.getTime();
  console.log(`[Newsletter] Primer envio programado en ${Math.round(msUntil8am / 60000)} minutos (${next8am.toLocaleString()})`);

  setTimeout(() => {
    sendDailyNewsletter();
    setInterval(sendDailyNewsletter, TWENTY_FOUR_HOURS);
  }, msUntil8am);
};
