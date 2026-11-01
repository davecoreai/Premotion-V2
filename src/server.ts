import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { sendMagicLink, verifyAndActivate } from './server/am-service';
import {
  getGlobalStats,
  getGlobalHistory,
  addGlobalActivation,
  maskEmail,
} from './server/storage';
import {
  getTelegramConfig,
  updateTelegramConfig,
  notifyNewActivation,
  sendPeriodicStatsReport,
  startPeriodicStatsTimer,
} from './server/telegram';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middlewares for API parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start 5-minute periodic Telegram stats timer
startPeriodicStatsTimer();

// --- REST API ENDPOINTS ---

/**
 * Global Stats: Real Total Activations, Real Total Users, Real Today Activations
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = getGlobalStats();
    res.json({
      success: true,
      totalActivations: stats.totalActivations,
      totalUsers: stats.totalUsers,
      todayActivations: stats.todayActivations,
      lastDate: stats.lastDate,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

/**
 * Global History: Real shared activations list across all users
 */
app.get('/api/history', (req, res) => {
  try {
    const history = getGlobalHistory();
    res.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, error: errorMsg });
  }
});

/**
 * System Status
 */
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'ONLINE',
    version: 'Premotion Liquid Glass',
    engine: 'Dalvik 2.1.0 Protocol',
    provider: 'Alight Creative Identity Gateway',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Telegram Config & Testing Endpoints
 */
app.get('/api/telegram/config', (req, res) => {
  const config = getTelegramConfig();
  res.json({
    success: true,
    botToken: config.botToken ? '••••••••' + config.botToken.slice(-4) : '',
    chatId: config.chatId,
    enabled: config.enabled,
    hasToken: Boolean(config.botToken && config.chatId),
  });
});

app.post('/api/telegram/config', (req, res) => {
  const { botToken, chatId, enabled } = req.body;
  const updated = updateTelegramConfig({
    ...(botToken !== undefined && { botToken: botToken.trim() }),
    ...(chatId !== undefined && { chatId: String(chatId).trim() }),
    ...(enabled !== undefined && { enabled: Boolean(enabled) }),
  });

  res.json({
    success: true,
    message: 'Konfigurasi Telegram Bot berhasil diperbarui!',
    config: {
      botToken: updated.botToken ? '••••••••' + updated.botToken.slice(-4) : '',
      chatId: updated.chatId,
      enabled: updated.enabled,
      hasToken: Boolean(updated.botToken && updated.chatId),
    },
  });
});

app.post('/api/telegram/test', async (req, res) => {
  try {
    const result = await sendPeriodicStatsReport();
    if (result.ok) {
      res.json({
        success: true,
        message: 'Pesan tes statistik berhasil dikirim ke Telegram Bot!',
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Gagal mengirim pesan. Pastikan Bot Token dan Chat ID benar dan Bot telah dikirim pesan /start.',
        errorCode: result.errorCode,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * Send Magic Link to Email
 */
app.post('/api/send-link', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({
      success: false,
      message: 'Email tidak valid. Pastikan format email benar (contoh: user@gmail.com).',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const result = await sendMagicLink(cleanEmail);

  if (!result.ok) {
    return res.status(400).json({
      success: false,
      message: result.error,
      detail: result.raw,
    });
  }

  return res.json({
    success: true,
    email: cleanEmail,
    message: `Magic link berhasil dikirim ke ${cleanEmail}. Silakan periksa Kotak Masuk atau Spam email kamu.`,
  });
});

/**
 * Verify Magic Link & Activate Alight Motion Premium
 */
app.post('/api/verify-link', async (req, res) => {
  const { email, magicLink } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Email wajib diisi.',
    });
  }
  if (!magicLink || !magicLink.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Magic Link verifikasi wajib diisi.',
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const result = await verifyAndActivate(cleanEmail, magicLink.trim());

  if (!result.ok) {
    return res.status(400).json({
      success: false,
      message: result.error,
      detail: result.raw,
    });
  }

  // Record into global history with Order ID: Premotion - *******
  const activationData = result.data!;
  const newRecord = {
    orderId: activationData.orderId,
    email: cleanEmail,
    maskedEmail: maskEmail(cleanEmail),
    uid: activationData.uid,
    activatedAt: activationData.activatedAt,
    validUntil: activationData.validUntil,
    validUntilTimestamp: activationData.validUntilTimestamp,
    plan: activationData.plan,
    subscriptionType: activationData.subscriptionType,
    status: 'ACTIVE' as const,
    idToken: activationData.idToken,
    refreshToken: activationData.refreshToken,
  };

  const { stats } = addGlobalActivation(newRecord);

  // Send real-time notification to Telegram Bot for every new history entry!
  notifyNewActivation(newRecord).catch((err) => {
    console.error('Failed to dispatch Telegram notification:', err);
  });

  return res.json({
    success: true,
    message: 'Verifikasi berhasil! Alight Motion Premium kini aktif.',
    data: {
      ...activationData,
      stats: {
        total: stats.totalActivations,
        today: stats.todayActivations,
        users: stats.totalUsers,
      },
    },
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);

export { app };
export default app;
