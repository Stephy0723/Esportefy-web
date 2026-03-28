const SCORE_STAGES = [
  { key: 'welcome', label: 'Bienvenida', max: 15, nextTarget: 25, nextLabel: 'Base competitiva' },
  { key: 'build', label: 'En construccion', max: 39, nextTarget: 40, nextLabel: 'Ritmo estable' },
  { key: 'grow', label: 'Tomando ritmo', max: 64, nextTarget: 65, nextLabel: 'Nivel competitivo' },
  { key: 'push', label: 'Modo competitivo', max: 84, nextTarget: 85, nextLabel: 'Alto rendimiento' },
  { key: 'elite', label: 'Alto rendimiento', max: 100, nextTarget: null, nextLabel: '' }
];

const clampScore = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const getStage = (score) => SCORE_STAGES.find((stage) => score <= stage.max) || SCORE_STAGES[SCORE_STAGES.length - 1];

const buildProgressNote = (score, stage) => {
  if (!stage?.nextTarget) {
    return 'Tu barra ya esta en una zona alta. Ahora la clave es mantener constancia y pulir detalles finos.';
  }

  const missing = Math.max(0, stage.nextTarget - score);
  if (missing === 0) {
    return `Ya estas listo para entrar en ${stage.nextLabel}.`;
  }

  return `Te faltan ${missing} punto${missing === 1 ? '' : 's'} para entrar en ${stage.nextLabel}.`;
};

const pickActionItems = (context) => {
  const actions = [];

  if (context.tournamentCount === 0) actions.push(`Juega tu primer torneo de ${context.mainGame}`);
  if (context.connCount < 2) actions.push('Conecta redes y cuentas de juego');
  if (context.communityCount === 0) actions.push('Unete a una comunidad y empieza a interactuar');
  if (context.teamCount === 0) actions.push(`Busca equipo o crea uno para ${context.mainGame}`);
  if (context.gamesCount < 3) actions.push('Completa tu perfil con mas juegos y roles');

  if (actions.length < 3) {
    actions.push('Actualiza tu perfil para que otros jugadores te encuentren');
  }
  if (actions.length < 3) {
    actions.push('Manten actividad semanal dentro de la plataforma');
  }

  return actions.slice(0, 3);
};

const buildWinRateGuidance = (score, stage, context) => {
  const progressNote = buildProgressNote(score, stage);

  switch (stage.key) {
    case 'welcome':
      return {
        stageLabel: stage.label,
        message: `Bienvenido a tu radar competitivo. Tu win rate esta en ${score}% y esta barra empezara a moverse de verdad cuando compitas en torneos y cierres participaciones reales.`,
        advice: `Entra a torneos abiertos de ${context.mainGame}, completa tu perfil, conecta tus redes y habla con otros jugadores. La meta ahora no es verte pro, sino empezar a construir historial competitivo.`,
        plan: `Objetivo inmediato: juega tu ${context.tournamentCount === 0 ? 'primer' : 'siguiente'} torneo, termina el bracket y revisa el resultado con tu equipo. ${progressNote}`,
        progressNote
      };
    case 'build':
      return {
        stageLabel: stage.label,
        message: `Ya comenzaste a competir, pero todavia estas en fase de aprendizaje. Cada torneo te da data util para subir esta barra sin improvisar.`,
        advice: `No persigas volumen sin analisis. Revisa tus derrotas, detecta un patron por semana y practica solo esa debilidad hasta que deje de repetirse.`,
        plan: `Objetivo inmediato: cerrar otro torneo con mejor lectura de errores, VOD review y una estrategia mas clara para ${context.mainGame}. ${progressNote}`,
        progressNote
      };
    case 'grow':
      return {
        stageLabel: stage.label,
        message: 'Tu win rate ya empieza a mostrar competitividad real. La barra no necesita mas ruido: necesita consistencia, preparacion y decisiones limpias.',
        advice: 'Mantente en ritmo de scrims, estudia el meta y llega a cada torneo con dos planes claros: tu composicion principal y tu respuesta al counter mas comun.',
        plan: `Objetivo inmediato: convertir este progreso en resultados repetibles durante los proximos torneos de ${context.mainGame}. ${progressNote}`,
        progressNote
      };
    case 'push':
      return {
        stageLabel: stage.label,
        message: 'Estas en una zona competitiva de verdad. Tu barra ya no sube solo por jugar: sube por adaptarte mas rapido que el rival.',
        advice: 'Apunta a brackets mas exigentes, estudia rivales antes del match y trabaja microajustes de comunicacion. La diferencia ya esta en los detalles.',
        plan: `Objetivo inmediato: sostener resultados contra rivales mas fuertes y empujar esta barra a nivel alto. ${progressNote}`,
        progressNote
      };
    default:
      return {
        stageLabel: stage.label,
        message: 'Tu win rate ya transmite nivel alto. Ahora la prioridad no es llenar la barra, sino defender ese estandar cuando el nivel del lobby suba.',
        advice: 'Compite en torneos mas duros, documenta lo que te funciona y usa ese conocimiento para liderar, entrenar o elevar a tu roster.',
        plan: 'Objetivo inmediato: mantener el pico, evitar estancarte y convertir tu experiencia en ventaja estructural para tu equipo.',
        progressNote
      };
  }
};

const buildLeadershipGuidance = (score, stage, context) => {
  const progressNote = buildProgressNote(score, stage);

  switch (stage.key) {
    case 'welcome':
      return {
        stageLabel: stage.label,
        message: `Tu liderazgo esta en ${score}% porque todavia falta asumir un rol visible dentro de un equipo. Aqui no se trata solo de mandar: se trata de organizar, sostener y mover gente.`,
        advice: `Crea o busca un equipo de ${context.mainGame}, ayuda a coordinar practicas y toma la iniciativa en conversaciones, reclutamiento y seguimiento.`,
        plan: `Objetivo inmediato: entrar en una estructura de equipo y empezar a asumir responsabilidades reales. ${progressNote}`,
        progressNote
      };
    case 'build':
      return {
        stageLabel: stage.label,
        message: 'Ya estas dentro de un entorno de equipo, pero aun no se siente una huella de liderazgo constante en la barra.',
        advice: 'Empieza con liderazgo practico: arma horarios, propone revisiones post-partido y lleva seguimiento de roles, asistencia y objetivos.',
        plan: `Objetivo inmediato: pasar de jugador presente a jugador que ordena, empuja y mejora el ritmo del equipo. ${progressNote}`,
        progressNote
      };
    case 'grow':
      return {
        stageLabel: stage.label,
        message: 'Tu barra ya refleja que puedes influir en el rendimiento colectivo. Ahora toca volver ese liderazgo mas estable y menos reactivo.',
        advice: 'Define rutinas: practicas semanales, cierre despues de scrims, feedback corto y decisiones claras antes de cada torneo.',
        plan: `Objetivo inmediato: convertir tu iniciativa en estructura y hacer que el equipo dependa menos de la improvisacion. ${progressNote}`,
        progressNote
      };
    case 'push':
      return {
        stageLabel: stage.label,
        message: 'Ya proyectas liderazgo competitivo. Lo que sigue no es hablar mas, sino tomar mejores decisiones cuando el partido se aprieta.',
        advice: 'Trabaja liderazgo bajo presion: calls simples, roles bien definidos, correcciones rapidas y cultura de mejora sin drama dentro del roster.',
        plan: `Objetivo inmediato: sostener la disciplina del equipo en torneos y empujar esta barra a una zona de referente. ${progressNote}`,
        progressNote
      };
    default:
      return {
        stageLabel: stage.label,
        message: 'Tu liderazgo ya es una fortaleza real. Esta barra alta significa que tu presencia impacta la organizacion y el rendimiento del equipo.',
        advice: 'Escala tu impacto: mentoriza, crea procesos y convierte la experiencia del roster en un sistema que funcione incluso sin improvisacion.',
        plan: 'Objetivo inmediato: mantener el nivel de direccion y usarlo para competir mejor, reclutar mejor y crecer como referente.',
        progressNote
      };
  }
};

const buildNetworkGuidance = (score, stage, context) => {
  const progressNote = buildProgressNote(score, stage);

  switch (stage.key) {
    case 'welcome':
      return {
        stageLabel: stage.label,
        message: `Tu red social competitiva todavia es pequena. Esta barra sube cuando te vuelves visible: conectas redes, entras en comunidades, agregas jugadores y mantienes tu perfil activo.`,
        advice: 'Empieza por lo basico: vincula Discord y tu cuenta principal de juego, unete a comunidades, agrega jugadores despues de cada partida y deja que tu perfil trabaje por ti.',
        plan: `Objetivo inmediato: conectar cuentas, entrar en comunidad y empezar a interactuar para que otros jugadores te ubiquen con facilidad. ${progressNote}`,
        progressNote
      };
    case 'build':
      return {
        stageLabel: stage.label,
        message: 'Tu presencia ya existe, pero todavia no genera demasiado movimiento. La barra mejorara cuando pases de estar conectado a estar presente.',
        advice: 'No basta con vincular cuentas. Participa en comunidades, comenta, comparte resultados, responde invitaciones y mantente localizable para equipos y organizadores.',
        plan: `Objetivo inmediato: sumar mas visibilidad, actividad social y conexiones utiles alrededor de ${context.mainGame}. ${progressNote}`,
        progressNote
      };
    case 'grow':
      return {
        stageLabel: stage.label,
        message: 'Ya tienes una red decente y eso empieza a abrir oportunidades. Tu siguiente salto esta en convertir contactos en oportunidades competitivas.',
        advice: 'Manten tus redes actualizadas, agrega a los buenos contactos despues de torneos y usa comunidades para conseguir scrims, tryouts y aliados.',
        plan: `Objetivo inmediato: volver tu presencia social en una ventaja competitiva constante. ${progressNote}`,
        progressNote
      };
    case 'push':
      return {
        stageLabel: stage.label,
        message: 'Tu barra social ya esta en modo competitivo. Eso significa que la gente puede encontrarte, seguirte y moverse contigo dentro del ecosistema.',
        advice: 'Ahora trabaja reputacion: responde rapido, comparte tu progreso, ayuda a otros y mantente activo donde juegan tus contactos fuertes.',
        plan: `Objetivo inmediato: sostener una red confiable y visible que te acerque a mejores equipos, eventos y torneos. ${progressNote}`,
        progressNote
      };
    default:
      return {
        stageLabel: stage.label,
        message: 'Tu red ya es una ventaja. No todos los jugadores llegan aqui: significa que estas visible, conectado y dentro de conversaciones importantes.',
        advice: 'Usa esa presencia para generar oportunidades: invitaciones, reclutamiento, colaboraciones y circulacion de tu nombre en el ecosistema.',
        plan: 'Objetivo inmediato: mantener reputacion, actividad y alcance sin dejar que la presencia social se enfrie.',
        progressNote
      };
  }
};

const buildConsistencyGuidance = (score, stage, context) => {
  const progressNote = buildProgressNote(score, stage);

  switch (stage.key) {
    case 'welcome':
      return {
        stageLabel: stage.label,
        message: `Estas en una etapa temprana dentro de la plataforma. Esta barra crece cuando mantienes actividad real: perfil completo, juegos definidos, equipos, torneos y presencia sostenida.`,
        advice: 'Haz lo basico bien: completa avatar, bio, juegos, redes y vuelve cada semana. La consistencia empieza con pequenos habitos, no con grandes promesas.',
        plan: `Objetivo inmediato: entrar en una rutina simple de actividad semanal y dejar tu perfil listo para competir. ${progressNote}`,
        progressNote
      };
    case 'build':
      return {
        stageLabel: stage.label,
        message: 'Tu constancia ya se nota, pero aun depende de impulsos aislados. La barra subira cuando conviertas esa energia en rutina.',
        advice: 'Pon fechas fijas: revisar perfil, jugar scrims, entrar a comunidades y mirar torneos una vez por semana. La repeticion ordenada es lo que construye consistencia.',
        plan: `Objetivo inmediato: mantener actividad semanal real durante varias semanas seguidas. ${progressNote}`,
        progressNote
      };
    case 'grow':
      return {
        stageLabel: stage.label,
        message: 'Tu constancia ya tiene forma. Ahora la barra pide continuidad, no solo presencia esporadica.',
        advice: 'Mantente activo incluso cuando no haya torneo: actualiza perfil, revisa oportunidades, responde mensajes y sigue empujando tu entorno competitivo.',
        plan: `Objetivo inmediato: consolidar una rutina mensual que sostenga tu crecimiento sin pausas largas. ${progressNote}`,
        progressNote
      };
    case 'push':
      return {
        stageLabel: stage.label,
        message: 'Tu perfil ya transmite compromiso serio. La barra esta en una zona donde lo dificil no es subir, sino no bajar.',
        advice: 'Protege tu ritmo: no abandones la actividad cuando termine un torneo. Sigue con scrims, networking, perfil y objetivos visibles.',
        plan: `Objetivo inmediato: sostener tu presencia competitiva sin huecos y convertirla en reputacion. ${progressNote}`,
        progressNote
      };
    default:
      return {
        stageLabel: stage.label,
        message: 'Tu consistencia es una fortaleza competitiva. Eso hace que tus otras barras suban con mas facilidad porque ya tienes ritmo propio.',
        advice: 'Usa esa disciplina para escalar el siguiente nivel: torneos mas fuertes, objetivos mensuales y seguimiento real de tu progreso.',
        plan: 'Objetivo inmediato: mantener el nivel de actividad y usarlo para fortalecer las areas que aun no estan en pico.',
        progressNote
      };
  }
};

const buildVersatilityGuidance = (score, stage, context) => {
  const progressNote = buildProgressNote(score, stage);

  switch (stage.key) {
    case 'welcome':
      return {
        stageLabel: stage.label,
        message: `Tu versatilidad esta en una etapa inicial. Esta barra crece cuando amplias tu repertorio, pruebas generos distintos y haces que tu perfil no dependa de un solo entorno.`,
        advice: `Empieza por sumar juegos cercanos a ${context.mainGame}, explorar otro genero y dejar claro en tu perfil donde puedes rendir mejor.`,
        plan: `Objetivo inmediato: agregar mas variedad sin perder foco competitivo. ${progressNote}`,
        progressNote
      };
    case 'build':
      return {
        stageLabel: stage.label,
        message: 'Ya existe una base de variedad, pero todavia falta amplitud para que la barra se sienta solida.',
        advice: 'Prueba un segundo o tercer entorno competitivo que complemente tus habilidades actuales. La adaptabilidad te vuelve mas util para equipos y torneos.',
        plan: `Objetivo inmediato: ampliar tu catalogo de juegos y generos con sentido competitivo. ${progressNote}`,
        progressNote
      };
    case 'grow':
      return {
        stageLabel: stage.label,
        message: 'Tu barra ya refleja un perfil mas adaptable. Eso te ayuda a leer mejor metas distintos y a transferir habilidades entre juegos.',
        advice: 'No explores por llenar espacios: elige juegos que aporten lectura, mecanicas o toma de decisiones que fortalezcan tu core competitivo.',
        plan: `Objetivo inmediato: convertir tu variedad en una ventaja practica para tu rendimiento general. ${progressNote}`,
        progressNote
      };
    case 'push':
      return {
        stageLabel: stage.label,
        message: 'Tu versatilidad ya es una ventaja real. Eso sugiere que puedes adaptarte a contextos distintos sin perder identidad competitiva.',
        advice: 'Mantente al dia con nuevos lanzamientos y usa tu repertorio para leer tendencias antes que otros jugadores.',
        plan: `Objetivo inmediato: sostener tu amplitud sin descuidar tu juego principal. ${progressNote}`,
        progressNote
      };
    default:
      return {
        stageLabel: stage.label,
        message: 'Tu versatilidad esta en una zona muy fuerte. Eso te vuelve mas flexible, mas facil de integrar en proyectos y mas resistente a cambios de meta.',
        advice: 'Usa esa amplitud para destacar: comparte conocimiento, prueba estrategias cruzadas y mantente listo para cambios del ecosistema.',
        plan: 'Objetivo inmediato: seguir diversificando con criterio y mantener tu perfil fresco, competitivo y adaptable.',
        progressNote
      };
  }
};

export const getMetricGuidance = (metric, context) => {
  const score = clampScore(metric?.numericValue);
  const stage = getStage(score);

  switch (metric?.id) {
    case 'winrate':
      return buildWinRateGuidance(score, stage, context);
    case 'leadership':
      return buildLeadershipGuidance(score, stage, context);
    case 'network':
      return buildNetworkGuidance(score, stage, context);
    case 'consistency':
      return buildConsistencyGuidance(score, stage, context);
    case 'versatility':
      return buildVersatilityGuidance(score, stage, context);
    default: {
      const progressNote = buildProgressNote(score, stage);
      return {
        stageLabel: stage.label,
        message: 'Tu barra ya esta siendo medida y puede seguir creciendo con actividad competitiva real.',
        advice: 'Sigue participando, completa tu perfil y mantente activo en equipos, comunidades y torneos.',
        plan: `Objetivo inmediato: seguir acumulando actividad de calidad. ${progressNote}`,
        progressNote
      };
    }
  }
};

export const getOverallMetricsWelcome = ({
  overallScore,
  strongestMetric,
  weakestMetric,
  mainGame,
  connCount,
  teamCount,
  communityCount,
  tournamentCount,
  gamesCount
}) => {
  const score = clampScore(overallScore);
  const stage = getStage(score);
  const actionItems = pickActionItems({
    mainGame,
    connCount,
    teamCount,
    communityCount,
    tournamentCount,
    gamesCount
  });

  if (stage.key === 'welcome') {
    return {
      kicker: 'Bienvenido a tus metricas',
      title: 'Empieza a construir tu presencia competitiva',
      message: 'Este panel no esta para juzgarte: esta para guiarte. Tus barras van a subir cuando participes en torneos, conectes tus redes, completes tu perfil y te muevas dentro de la comunidad.',
      priority: weakestMetric
        ? `${weakestMetric.label} es hoy tu mejor punto de arranque. Si empujas esa barra, tu overall empezara a reaccionar mas rapido.`
        : 'Tu primer objetivo es activar movimiento real dentro de la plataforma.',
      momentum: strongestMetric
        ? `${strongestMetric.label} ya te da una base. Aprovecha esa fortaleza mientras completas lo que aun esta vacio.`
        : 'Aun no hay una fortaleza dominante, asi que conviene enfocarte en acciones simples y repetibles.',
      actionItems
    };
  }

  if (stage.key === 'build') {
    return {
      kicker: 'Tu progreso ya empezo',
      title: 'Ahora toca convertir actividad en estructura',
      message: 'Ya hay senales de movimiento en tu perfil. El siguiente salto no viene de hacer mas cosas al azar, sino de repetir mejor las que mas impacto tienen.',
      priority: weakestMetric
        ? `Refuerza ${weakestMetric.label} sin abandonar lo demas. Esa es la barra que mas puede levantar tu promedio ahora mismo.`
        : 'Refuerza la base de tu perfil con actividad semanal.',
      momentum: strongestMetric
        ? `${strongestMetric.label} es tu motor actual. Usalo para abrir oportunidades mientras estabilizas el resto.`
        : 'Tu progreso esta equilibrado, pero aun necesita una fortaleza clara.',
      actionItems
    };
  }

  if (stage.key === 'grow') {
    return {
      kicker: 'Buen ritmo competitivo',
      title: 'Tu perfil ya esta entrando en zona seria',
      message: 'Tus metricas ya no parecen de un perfil vacio. Ahora la mejora mas fuerte vendra de sostener frecuencia, decisiones y presencia social con intencion.',
      priority: weakestMetric
        ? `La mejor forma de subir el overall es desbloquear el siguiente nivel de ${weakestMetric.label}.`
        : 'Sigue empujando la barra con menor rendimiento relativo.',
      momentum: strongestMetric
        ? `${strongestMetric.label} ya transmite solidez. Aprovechala como punto de apoyo.`
        : 'Tu progreso es parejo; ahora conviene crear una fortaleza clara.',
      actionItems
    };
  }

  if (stage.key === 'push') {
    return {
      kicker: 'Modo competitivo',
      title: 'Ya no se trata de empezar, sino de afinar',
      message: 'Tu perfil ya tiene buena forma competitiva. Desde aqui las barras suben menos por volumen y mas por calidad: mejores decisiones, mejores torneos y mejor presencia.',
      priority: weakestMetric
        ? `Pulir ${weakestMetric.label} es la forma mas inteligente de acercarte a una version mas completa de tu perfil.`
        : 'Pulir el area menos fuerte te dara el salto mas visible.',
      momentum: strongestMetric
        ? `${strongestMetric.label} es hoy tu sello. Mantenlo fuerte mientras corriges lo que aun esta por debajo.`
        : 'Tu perfil esta bastante balanceado; el siguiente salto esta en los detalles.',
      actionItems
    };
  }

  return {
    kicker: 'Perfil de alto rendimiento',
    title: 'Tus metricas ya proyectan un jugador serio',
    message: 'Llegaste a una zona donde la plataforma ya reconoce una presencia competitiva fuerte. El reto ahora es sostener el nivel, no conformarte y seguir creciendo con criterio.',
    priority: weakestMetric
      ? `Incluso en un perfil fuerte, ${weakestMetric.label} sigue siendo el mejor lugar para encontrar margen adicional.`
      : 'Sigue revisando tus puntos ciegos aunque el overall este alto.',
    momentum: strongestMetric
      ? `${strongestMetric.label} es una fortaleza clara. Puede convertirse en tu sello dentro de la plataforma.`
      : 'Tu perfil es fuerte y bastante equilibrado.',
    actionItems
  };
};
