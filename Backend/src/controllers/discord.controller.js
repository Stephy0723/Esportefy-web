import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const discordAuth = (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).send('Token requerido');

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

  } catch (error) {
    console.error('Discord auth error:', error.message);
    res.redirect('http://localhost:5173/settings?discord=error');
  }
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
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'connections.discord': '' }
    });

    return res.json({ message: 'Discord desvinculado' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al desvincular Discord' });
  }
};



