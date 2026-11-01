import axios, { AxiosError } from 'axios';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getGlobalStats } from './storage';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface TelegramSendResult {
  ok: boolean;
  message?: string;
  errorCode?: number;
}

const CONFIG_FILE = join(process.cwd(), 'data', 'telegram_config.json');

function loadTelegramConfig(): TelegramConfig {
  let botToken = process.env['TELEGRAM_BOT_TOKEN'] || '';
  let chatId = process.env['TELEGRAM_CHAT_ID'] || '';
  let enabled = true;

  if (existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      if (data.botToken !== undefined) botToken = data.botToken;
      if (data.chatId !== undefined) chatId = data.chatId;
      if (data.enabled !== undefined) enabled = data.enabled;
    } catch (err) {
      console.debug('Error reading telegram_config.json:', err);
    }
  }

  return { botToken, chatId, enabled };
}

let currentConfig: TelegramConfig = loadTelegramConfig();

export function getTelegramConfig(): TelegramConfig {
  return currentConfig;
}

export function updateTelegramConfig(config: Partial<TelegramConfig>): TelegramConfig {
  currentConfig = {
    ...currentConfig,
    ...config,
  };

  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving telegram_config.json:', err);
  }

  return currentConfig;
}

export async function sendTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramSendResult> {
  const { botToken, chatId, enabled } = currentConfig;

  if (!enabled || !botToken || !chatId || botToken.trim() === '' || chatId.trim() === '') {
    return {
      ok: false,
      message: 'Telegram notification disabled or missing Bot Token / Chat ID.',
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const response = await axios.post(
      url,
      {
        chat_id: chatId.trim(),
        text,
        parse_mode: parseMode,
      },
      { timeout: 8000 }
    );

    if (response.data && response.data.ok) {
      return { ok: true, message: 'Message sent successfully.' };
    } else {
      return {
        ok: false,
        message: response.data?.description || 'Failed to send Telegram message.',
      };
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ description?: string; error_code?: number }>;
      const status = axiosErr.response?.status;
      const description = axiosErr.response?.data?.description;

      if (status === 403) {
        const readableReason =
          description ||
          'Akses Ditolak (403): Bot Telegram diblokir atau belum menerima pesan /start dari Chat ID tersebut.';
        console.warn('Telegram 403 Notice:', readableReason);
        return { ok: false, errorCode: 403, message: readableReason };
      }

      if (status === 400 || status === 404) {
        const readableReason =
          description || 'Chat ID atau Bot Token Telegram tidak ditemukan / tidak valid.';
        console.warn('Telegram Error:', readableReason);
        return { ok: false, errorCode: status, message: readableReason };
      }

      return {
        ok: false,
        errorCode: status || 500,
        message: description || axiosErr.message,
      };
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Telegram send warning:', msg);
    return { ok: false, message: msg };
  }
}

/**
 * Sends notification for every new history/activation entry
 */
export async function notifyNewActivation(record: {
  orderId: string;
  maskedEmail: string;
  activatedAt: string;
  plan: string;
}): Promise<TelegramSendResult> {
  const formattedDate = new Date(record.activatedAt).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
  });

  const message = [
    `<b>🔔 History Aktivasi Baru!</b>`,
    ``,
    `📌 <b>Order ID:</b> <code>${record.orderId}</code>`,
    `📧 <b>Email:</b> <code>${record.maskedEmail}</code>`,
    `💎 <b>Paket:</b> ${record.plan} 1 Tahun`,
    `🕒 <b>Waktu:</b> ${formattedDate} WIB`,
    `✅ <b>Status:</b> AKTIF`,
  ].join('\n');

  return sendTelegramMessage(message);
}

/**
 * Sends periodic report every 5 minutes:
 * Total Pengguna : X
 * Total Aktivasi : Y
 */
export async function sendPeriodicStatsReport(): Promise<TelegramSendResult> {
  const { botToken, chatId, enabled } = currentConfig;
  if (!enabled || !botToken || !chatId) {
    return { ok: false, message: 'Telegram configuration is incomplete.' };
  }

  const stats = getGlobalStats();

  const message = [
    `Total Pengguna : ${stats.totalUsers}`,
    `Total Aktivasi : ${stats.totalActivations}`,
  ].join('\n');

  return sendTelegramMessage(message, 'HTML');
}

let timerInitialized = false;

/**
 * Initializes the 5-minute interval timer for periodic stats report
 */
export function startPeriodicStatsTimer() {
  if (timerInitialized) return;
  timerInitialized = true;

  // Send periodic stats every 5 minutes (300,000 ms)
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  setInterval(() => {
    const { botToken, chatId, enabled } = currentConfig;
    if (enabled && botToken && chatId) {
      sendPeriodicStatsReport().catch((err) => {
        console.debug('Periodic Telegram stats report notice:', err);
      });
    }
  }, FIVE_MINUTES_MS);

  console.log('Telegram 5-minute periodic stats timer started.');
}
