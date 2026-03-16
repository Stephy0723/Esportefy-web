import News from '../models/News.js';
import { NEWS } from '../../../frontend/src/data/newsData.js';

// ── helpers ────────────────────────────────────────────────────
const clampInt = (raw, min, max, fallback) => {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : fallback;
};

// ── GET /api/news ─────────────────────────────────────────────
// Devuelve noticias de la BD + las estáticas de newsData.js
export const getNews = async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 1, 100, 50);
    const page  = clampInt(req.query.page, 1, 9999, 1);
    const skip  = (page - 1) * limit;

    const categoryFilter = req.query.category && req.query.category !== 'Todos'
      ? req.query.category : null;
    const gameFilter = req.query.game && req.query.game !== 'Todos'
      ? req.query.game : null;
    const search = (req.query.search || '').trim();

    // Fetch custom news from DB
    const dbFilter = {};
    if (categoryFilter) dbFilter.category = categoryFilter;
    if (gameFilter) dbFilter.game = gameFilter;
    if (search) {
      dbFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
      ];
    }

    const dbNews = await News.find(dbFilter)
      .sort({ createdAt: -1 })
      .lean();

    // Mark DB news as custom
    const dbItems = dbNews.map((item) => ({
      ...item,
      id: item._id,
      isCustom: true,
    }));

    // Filter static news
    let staticItems = NEWS.map((item) => ({ ...item, isCustom: false }));
    if (categoryFilter) staticItems = staticItems.filter((n) => n.category === categoryFilter);
    if (gameFilter) staticItems = staticItems.filter((n) => n.game === gameFilter);
    if (search) {
      const re = new RegExp(search, 'i');
      staticItems = staticItems.filter((n) => re.test(n.title) || re.test(n.excerpt));
    }

    // Combine: custom first, then static
    const all = [...dbItems, ...staticItems];
    const total = all.length;
    const items = all.slice(skip, skip + limit);

    return res.json({ total, page, limit, items });
  } catch (error) {
    console.error('getNews error:', error);
    return res.status(500).json({ message: 'Error obteniendo noticias' });
  }
};

// ── GET /api/news/:id ─────────────────────────────────────────
export const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check static news first
    const staticArticle = NEWS.find((n) => String(n.id) === id);
    if (staticArticle) {
      return res.json({ ...staticArticle, isCustom: false });
    }

    // Check DB
    const dbArticle = await News.findById(id).lean();
    if (!dbArticle) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    // Increment views
    await News.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return res.json({ ...dbArticle, id: dbArticle._id, isCustom: true });
  } catch (error) {
    console.error('getNewsById error:', error);
    return res.status(500).json({ message: 'Error obteniendo noticia' });
  }
};

// ── POST /api/news ────────────────────────────────────────────
export const createNews = async (req, res) => {
  try {
    const {
      title, excerpt, category, game, author, company,
      date, image, featured, tags, details, gallery,
    } = req.body;

    if (!title || !image) {
      return res.status(400).json({ message: 'Título e imagen son requeridos' });
    }

    const news = new News({
      title:     String(title).trim(),
      excerpt:   String(excerpt || '').trim(),
      category:  String(category || 'Institucional').trim(),
      game:      String(game || 'Multigame').trim(),
      author:    String(author || 'Mesa Editorial GLITCH GANG').trim(),
      company:   String(company || 'GLITCH GANG').trim(),
      date:      String(date || new Date().toISOString().slice(0, 10)).trim(),
      image:     String(image).trim(),
      featured:  Boolean(featured),
      tags:      Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      details:   Array.isArray(details) ? details.map((d) => String(d).trim()).filter(Boolean) : [],
      gallery:   Array.isArray(gallery) ? gallery.map((g) => String(g).trim()).filter(Boolean) : [],
      views:     0,
      comments:  0,
      createdBy: req.userId || null,
    });

    await news.save();

    return res.status(201).json({
      ...news.toObject(),
      id: news._id,
      isCustom: true,
    });
  } catch (error) {
    console.error('createNews error:', error);
    return res.status(500).json({ message: 'Error creando noticia' });
  }
};

// ── DELETE /api/news/:id ──────────────────────────────────────
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    if (String(news.createdBy) !== String(req.userId)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await News.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Noticia eliminada' });
  } catch (error) {
    console.error('deleteNews error:', error);
    return res.status(500).json({ message: 'Error eliminando noticia' });
  }
};
