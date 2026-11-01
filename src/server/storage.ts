import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface ActivationRecord {
  orderId: string;
  email: string;
  maskedEmail: string;
  uid: string;
  activatedAt: string;
  validUntil: string;
  validUntilTimestamp: number;
  plan: string;
  subscriptionType: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
}

export interface GlobalStats {
  totalActivations: number;
  totalUsers: number;
  todayActivations: number;
  lastDate: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'global_history.json');

// In-memory cache for serverless environments where disk is read-only
let memoryHistoryCache: ActivationRecord[] | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.debug('Read-only or serverless filesystem notice:', e);
    }
  }
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

export function generatePremotionOrderId(): string {
  // Format: Premotion - ******* (e.g. Premotion - 8F49D21)
  const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7);
  return `Premotion - ${code}`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getGlobalHistory(): ActivationRecord[] {
  if (memoryHistoryCache !== null) {
    return memoryHistoryCache;
  }

  ensureDataDir();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const list: ActivationRecord[] = JSON.parse(content);
      if (Array.isArray(list)) {
        memoryHistoryCache = list;
        return memoryHistoryCache;
      }
    }
  } catch (err) {
    console.debug('History load from disk notice:', err);
  }

  memoryHistoryCache = [];
  return memoryHistoryCache;
}

export function saveGlobalHistory(history: ActivationRecord[]) {
  memoryHistoryCache = history;
  ensureDataDir();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.debug('History save to disk notice (using in-memory cache):', err);
  }
}

export function getGlobalStats(): GlobalStats {
  const history = getGlobalHistory();
  const today = getTodayString();

  const totalActivations = history.length;
  const uniqueUsers = new Set(history.map((item) => item.email.toLowerCase().trim())).size;
  const todayActivations = history.filter((item) => item.activatedAt && item.activatedAt.startsWith(today)).length;

  return {
    totalActivations,
    totalUsers: uniqueUsers,
    todayActivations,
    lastDate: today,
  };
}

export function addGlobalActivation(rawRecord: Partial<ActivationRecord> & {
  orderId: string;
  email: string;
  maskedEmail: string;
  uid: string;
  activatedAt: string;
  validUntil: string;
  validUntilTimestamp: number;
  plan: string;
  subscriptionType: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
}): { stats: GlobalStats; history: ActivationRecord[] } {
  // Explicitly strip sensitive tokens if present
  const record: ActivationRecord = {
    orderId: rawRecord.orderId,
    email: rawRecord.email,
    maskedEmail: rawRecord.maskedEmail,
    uid: rawRecord.uid,
    activatedAt: rawRecord.activatedAt,
    validUntil: rawRecord.validUntil,
    validUntilTimestamp: rawRecord.validUntilTimestamp,
    plan: rawRecord.plan,
    subscriptionType: rawRecord.subscriptionType,
    status: rawRecord.status,
  };

  const history = getGlobalHistory();
  // Insert at the beginning of the list
  history.unshift(record);
  // Keep up to 500 real activations
  const trimmed = history.slice(0, 500);
  saveGlobalHistory(trimmed);

  const stats = getGlobalStats();
  return { stats, history: trimmed };
}
