import axios from 'axios';
import crypto from 'node:crypto';
import { generatePremotionOrderId } from './storage';

const FIREBASE_API_KEY = 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0';
const IDENTITY_TOOLKIT_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty';
const VERIFY_PURCHASE_URL = 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase';

const randomIp = () => `${crypto.randomInt(1, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(0, 255)}.${crypto.randomInt(1, 255)}`;

const spoofHeaders = (headers: Record<string, string>) => {
  const ip = randomIp();
  return {
    ...headers,
    'x-forwarded-for': ip,
    'x-real-ip': ip,
    'client-ip': ip,
    'x-client-ip': ip,
    'x-originating-ip': ip,
    'x-cluster-client-ip': ip,
  };
};

const androidHeaders = {
  'content-type': 'application/json',
  'x-android-package': 'com.alightcreative.motion',
  'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
  'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)',
};

const okhttpHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'user-agent': 'okhttp/3.12.1',
  'accept-encoding': 'gzip',
};

export function extractOobCode(raw: string): string | null {
  if (!raw) return null;
  let s = String(raw).replace(/&amp;/g, '&');
  try {
    s = decodeURIComponent(s);
  } catch (e) {
    void e;
  }
  try {
    const u = new URL(s);
    let c = u.searchParams.get('oobCode');
    if (!c) {
      const nested = u.searchParams.get('link') || u.searchParams.get('q') || u.searchParams.get('url');
      if (nested) {
        try {
          c = new URL(nested).searchParams.get('oobCode');
        } catch (e) {
          void e;
        }
      }
    }
    if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (e) {
    void e;
  }

  const match = s.match(/oobCode=([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];

  const trimmed = raw.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('://')) {
    return trimmed;
  }
  return null;
}

export function friendlyError(errStr: unknown): string {
  if (!errStr) return 'Terjadi kesalahan autentikasi.';
  const str = typeof errStr === 'string' ? errStr : JSON.stringify(errStr);
  if (str.includes('INVALID_OOB_CODE')) return 'Kode magic link tidak valid atau sudah pernah digunakan.';
  if (str.includes('EXPIRED_OOB_CODE')) return 'Magic link telah kedaluwarsa. Silakan kirim tautan baru.';
  if (str.includes('INVALID_EMAIL')) return 'Format email tidak valid.';
  if (str.includes('EMAIL_NOT_FOUND')) return 'Email tidak ditemukan. Kirim magic link terlebih dahulu.';
  if (str.includes('USER_DISABLED')) return 'Akun dinonaktifkan oleh administrator.';
  if (str.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) return 'Terlalu banyak percobaan. Silakan coba beberapa saat lagi.';
  if (str.includes('code gak ada') || str.includes('Gagal mengekstrak oobCode')) return 'Format magic link tidak valid. Pastikan menyalin seluruh tautan dari email.';
  return str.length > 300 ? str.slice(0, 300) : str;
}

export async function sendMagicLink(email: string) {
  try {
    const response = await axios.post(
      `${IDENTITY_TOOLKIT_URL}/getOobConfirmationCode?key=${FIREBASE_API_KEY}`,
      {
        requestType: 6,
        email: email,
        androidInstallApp: true,
        canHandleCodeInApp: true,
        continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
        iosBundleId: 'com.alightcreative.motion',
        androidPackageName: 'com.alightcreative.motion',
        androidMinimumVersion: '585',
        clientType: 'CLIENT_TYPE_ANDROID',
      },
      {
        headers: spoofHeaders(androidHeaders),
        timeout: 12000,
      }
    );
    return { ok: true, data: response.data };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown }; message?: string };
    const detail = axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : (axiosErr.message || String(err));
    return { ok: false, error: friendlyError(detail), raw: detail };
  }
}

export async function verifyAndActivate(email: string, rawLink: string) {
  const code = extractOobCode(rawLink);

  if (!code) {
    return { ok: false, error: 'Magic link tidak valid atau parameter oobCode tidak ditemukan.' };
  }

  // Pre-generate Premotion Order ID: Format "Premotion - *******"
  const orderId = generatePremotionOrderId();
  const now = new Date();
  const until = new Date();
  until.setFullYear(until.getFullYear() + 1);
  const formattedUntil = until.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  try {
    // 1. Sign in with Email Link via Google Identity Toolkit
    const signInRes = await axios.post(
      `${IDENTITY_TOOLKIT_URL}/emailLinkSignin?key=${FIREBASE_API_KEY}`,
      {
        email: email,
        oobCode: code,
        clientType: 'CLIENT_TYPE_ANDROID',
      },
      {
        headers: spoofHeaders(androidHeaders),
        timeout: 15000,
      }
    );

    const idToken = signInRes.data?.idToken;
    const uid = signInRes.data?.localId;
    const isNewUser = !!signInRes.data?.isNewUser;

    if (!idToken) {
      return { ok: false, error: 'Gagal melakukan otentikasi login dengan magic link.' };
    }

    // 2. Activate Premium Subscription via Cloud Function verifyPurchase
    const purchaseBody = {
      data: {
        productId: 'am.full.sub.annual.19q4',
        token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
        skuType: 'subs',
        orderId: orderId,
      },
    };

    const purchaseHeaders = {
      ...okhttpHeaders,
      authorization: 'Bearer ' + idToken,
      'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI',
    };

    let purchaseSuccess = true;
    let purchaseErrorDetail = '';

    try {
      const purchaseRes = await axios.post(VERIFY_PURCHASE_URL, purchaseBody, {
        headers: spoofHeaders(purchaseHeaders),
        timeout: 15000,
      });

      if (purchaseRes.data && purchaseRes.data.error) {
        purchaseSuccess = false;
        purchaseErrorDetail = JSON.stringify(purchaseRes.data.error);
      }
    } catch (purchaseErr: unknown) {
      const pErr = purchaseErr as { response?: { data?: unknown }; message?: string };
      purchaseErrorDetail = pErr.response?.data ? JSON.stringify(pErr.response.data) : (pErr.message || String(purchaseErr));
      console.warn('Purchase verification status:', purchaseErrorDetail);

      // If purchase verification explicitly rejects, flag error
      if (purchaseErrorDetail.includes('INVALID_PURCHASE') || purchaseErrorDetail.includes('PURCHASE_EXPIRED')) {
        purchaseSuccess = false;
      }
    }

    if (!purchaseSuccess) {
      return {
        ok: false,
        error: 'Verifikasi konfirmasi lisensi pembelian gagal. Silakan periksa kembali tautan yang dimasukkan.',
        raw: purchaseErrorDetail,
      };
    }

    // Do NOT return sensitive idToken or refreshToken to client!
    return {
      ok: true,
      data: {
        orderId,
        email,
        uid: uid || 'am_usr_' + crypto.randomBytes(4).toString('hex'),
        activatedAt: now.toISOString(),
        validUntil: formattedUntil,
        validUntilTimestamp: until.getTime(),
        plan: 'Premium',
        subscriptionType: 'Yearly Premium',
        status: 'ACTIVE' as const,
        isNewUser,
      }
    };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: unknown }; message?: string };
    const detail = axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : (axiosErr.message || String(err));
    return { ok: false, error: friendlyError(detail), raw: detail };
  }
}
