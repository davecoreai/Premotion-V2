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
  idToken?: string;
  refreshToken?: string;
}

export interface GlobalStats {
  totalActivations: number;
  totalUsers: number;
  todayActivations: number;
  lastDate: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'global_history.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('Failed to create data dir:', e);
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
  ensureDataDir();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const list: ActivationRecord[] = JSON.parse(content);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.error('Error loading history:', err);
  }
  return [];
}

export function saveGlobalHistory(history: ActivationRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving history:', err);
  }
}

export function getGlobalStats(): GlobalStats {
  const history = getGlobalHistory();
  const today = getTodayString();

  const totalActivations = history.length;
  const uniqueUsers = new Set(history.map(item => item.email.toLowerCase().trim())).size;
  const todayActivations = history.filter(item => item.activatedAt && item.activatedAt.startsWith(today)).length;

  return {
    totalActivations,
    totalUsers: uniqueUsers,
    todayActivations,
    lastDate: today,
  };
}

export function addGlobalActivation(record: ActivationRecord): { stats: GlobalStats; history: ActivationRecord[] } {
  const history = getGlobalHistory();
  // Insert at the beginning of the list
  history.unshift(record);
  // Keep up to 500 real activations
  const trimmed = history.slice(0, 500);
  saveGlobalHistory(trimmed);

  const stats = getGlobalStats();
  return { stats, history: trimmed };
}
