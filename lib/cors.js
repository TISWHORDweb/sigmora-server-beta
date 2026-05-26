const LOCAL_ORIGINS = [
  'http://localhost:3005',
  'http://localhost:5173',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:5173',
];

function normalizeOrigin(url) {
  if (!url) return url;
  return url.replace(/\/$/, '');
}

function getAllowedOrigins() {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || []),
  ]
    .filter(Boolean)
    .map(normalizeOrigin);

  return [...new Set([...fromEnv, ...LOCAL_ORIGINS])];
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  const allowed = getAllowedOrigins();
  if (allowed.includes(normalized)) return true;

  // Vercel preview & production deployments (*.vercel.app)
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;

  return false;
}

export const corsOptions = {
  origin(origin, callback) {
    // Server-to-server or same-origin requests
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS: blocked origin "${origin}". Set FRONTEND_URL or ALLOWED_ORIGINS on the server.`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400,
};
