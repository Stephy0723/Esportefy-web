import axios from 'axios';
import User from '../models/User.js';

/* =========================
   LINK RIOT ACCOUNT
========================= */
export const linkRiotAccount = async (req, res) => {
  try {
    const { riotId } = req.body;
    const userId = req.userId;

    if (!riotId || !riotId.includes('#')) {
      return res.status(400).json({ message: 'Riot ID inválido' });
    }

    const [gameName, tagLine] = riotId.split('#');

    /* =========================
       1️⃣ ACCOUNT-V1 → PUUID
    ========================= */
    const accountRes = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    const { puuid } = accountRes.data;
    const region = 'la1'; // ajustable luego

    /* =========================
       2️⃣ SUMMONER-V4 (AUTOMÁTICO)
    ========================= */
    const summonerRes = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    const summoner = summonerRes.data;

    /* =========================
       3️⃣ LEAGUE-V4 (AUTOMÁTICO)
    ========================= */
    let rank = null;

    try {
      const leagueRes = await axios.get(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
        {
          headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
        }
      );

      const soloQueue = leagueRes.data.find(
        q => q.queueType === 'RANKED_SOLO_5x5'
      );

      if (soloQueue) {
        rank = {
          queueType: soloQueue.queueType,
          tier: soloQueue.tier,
          division: soloQueue.rank,
          lp: soloQueue.leaguePoints
        };
      }
    } catch (rankError) {
      // El jugador puede no estar rankeado → NO es error
      rank = null;
    }

    /* =========================
       4️⃣ GUARDAR TODO EN MONGO
    ========================= */
    await User.findByIdAndUpdate(userId, {
      'connections.riot': {
        puuid,
        gameName,
        tagLine,
        region,
        verified: true,
        summonerId: summoner.id,
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        rank
      }
    });

    return res.json({
      message: 'Cuenta Riot vinculada y sincronizada correctamente'
    });

  } catch (error) {
    console.error('RIOT LINK ERROR:', error.response?.data || error.message);
    return res.status(400).json({
      message: 'Error vinculando cuenta Riot'
    });
  }
};

/* =========================
   UNLINK RIOT
========================= */
export const unlinkRiotAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'connections.riot': '' }
    });

    return res.json({ message: 'Riot desvinculado' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al desvincular Riot' });
  }
};

/* =========================
   SUMMONER V4 (OBLIGATORIO)
========================= */
export const getSummonerV4 = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user?.connections?.riot?.puuid) {
      return res.status(400).json({ message: 'Riot no vinculado' });
    }

    const riotRegion = user.connections.riot.region || 'la1';

    const response = await axios.get(
      `https://${riotRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${user.connections.riot.puuid}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    const summoner = response.data;

    if (!summoner.id) {
      return res.status(400).json({
        message: 'El usuario no tiene cuenta de League of Legends en esta región'
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      'connections.riot.summonerId': summoner.id,
      'connections.riot.profileIconId': summoner.profileIconId,
      'connections.riot.summonerLevel': summoner.summonerLevel
    });

    return res.json(summoner);

  } catch (error) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ message: 'Error obteniendo summoner' });
  }
};

/* =========================
   LEAGUE V4 (RANGO)
========================= */
export const getLeagueV4 = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user?.connections?.riot?.summonerId) {
      return res.status(400).json({
        message: 'Summoner ID no disponible. Ejecuta Summoner-V4 primero'
      });
    }

    const riotRegion = user.connections.riot.region || 'la1';
    const summonerId = user.connections.riot.summonerId;

    const response = await axios.get(
      `https://${riotRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    const soloQueue = response.data.find(
  q => q.queueType === 'RANKED_SOLO_5x5'
);

await User.findByIdAndUpdate(req.userId, {
  'connections.riot.rank': soloQueue
    ? {
        queueType: soloQueue.queueType,
        tier: soloQueue.tier,
        division: soloQueue.rank,
        lp: soloQueue.leaguePoints
      }
    : null
});


    return res.json(response.data);

  } catch (error) {
    console.error('LEAGUE-V4 ERROR:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Error obteniendo rango del jugador' });
  }
};

/* =========================
   MATCH V5 — GET MATCH IDS
========================= */
export const getMatchIdsV5 = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user?.connections?.riot?.puuid) {
      return res.status(400).json({ message: 'Riot no vinculado' });
    }

    const puuid = user.connections.riot.puuid;

    const response = await axios.get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        },
        params: {
          start: 0,
          count: 10
        }
      }
    );

    return res.json({
      count: response.data.length,
      matches: response.data
    });

  } catch (error) {
    console.error('MATCH IDS ERROR:', error.response?.data || error.message);
    return res.status(500).json({ message: 'Error obteniendo matches' });
  }
};

/* =========================
   MATCH V5 — MATCH DETAILS
========================= */
export const getMatchDetailsV5 = async (req, res) => {
  try {
    const { matchId } = req.params;

    const response = await axios.get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': process.env.RIOT_API_KEY
        }
      }
    );

    return res.json(response.data);

  } catch (error) {
    console.error('MATCH-V5 ERROR:', error.response?.data || error.message);

    return res.status(404).json({
      message: 'Match no disponible en Riot API',
      riotError: error.response?.data
    });
  }
};

