import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const discordAuth = (req, res) => {
  const token = req.query.token;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  const redirectUrl =
    `https://discord.com/api/oauth2/authorize` +
    `?client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify` +
    `&state=${userId}`;

  res.redirect(redirectUrl);
};

export const discordCallback = async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect('http://localhost:5173/settings?discord=error');
  }

  try {
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      'https://discord.com/api/users/@me',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const discordUser = userRes.data;

    await User.findByIdAndUpdate(
      state,
      {
        'connections.discord': {
          id: discordUser.id,
          username: `${discordUser.username}#${discordUser.discriminator}`,
          verified: true
        }
      }
    );

    res.redirect('http://localhost:5173/settings?discord=connected');

  } catch (error) {
    console.error(error);
    res.redirect('http://localhost:5173/settings?discord=error');
  }
};

export const unlinkDiscord = async (req, res) => {
  try {
    const userId = req.userId; // 🔥 AHORA SÍ EXISTE

    await User.findByIdAndUpdate(userId, {
      $unset: { 'connections.discord': '' }
    });

    res.json({ message: 'Discord desvinculado correctamente' });
  } catch (error) {
    console.error('❌ Error al desvincular Discord:', error);
    res.status(500).json({ message: 'Error al desvincular Discord' });
  }
};
