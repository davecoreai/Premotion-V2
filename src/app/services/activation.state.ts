import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface GlobalRecord {
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

export interface StatsResponse {
  totalActivations: number;
  totalUsers: number;
  todayActivations: number;
  lastDate?: string;
}

export interface StatsSnapshot {
  total: number;
  today: number;
  users?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ActivationState {
  private http = inject(HttpClient);

  // Fallback backend URL for custom domains (e.g. premotion.my.id) when static hosting has no local Express backend
  private readonly fallbackBackend = 'https://ais-pre-kdo67hnc6ovn5z54mkxerv-86214995860.asia-northeast1.run.app';

  // Real Stats signals (NO simulation, start from 0)
  readonly totalActivations = signal<number>(0);
  readonly totalUsers = signal<number>(0);
  readonly todayActivations = signal<number>(0);
  readonly isLoadingStats = signal<boolean>(false);

  // Real Global history signal (NO simulation)
  readonly globalHistory = signal<GlobalRecord[]>([]);
  readonly isLoadingHistory = signal<boolean>(false);

  // Activation Flow (Step 1 -> 2 -> 3)
  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly email = signal<string>('');
  readonly magicLink = signal<string>('');
  readonly activeResult = signal<GlobalRecord | null>(null);

  // Loading & status signals
  readonly isSendingLink = signal<boolean>(false);
  readonly isVerifying = signal<boolean>(false);
  readonly statusError = signal<string | null>(null);
  readonly statusSuccess = signal<string | null>(null);

  // Computed properties
  readonly hasActiveLicense = computed(() => !!this.activeResult());
  readonly recentActivations = computed(() => this.globalHistory().slice(0, 5));

  constructor() {
    this.loadStats();
    this.loadHistory();

    // Check localStorage for previous session if available in browser
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('premotion_active_session');
        if (saved) {
          const parsed = JSON.parse(saved) as GlobalRecord;
          this.activeResult.set(parsed);
          if (parsed.email) {
            this.email.set(parsed.email);
          }
        }
      } catch (err) {
        console.debug('Session restore:', err);
      }
    }
  }

  private async postApi<T>(endpoint: string, body: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.http.post<T>(endpoint, body));
    } catch (err) {
      console.warn(`Relative API ${endpoint} failed, retrying with live Cloud Run backend...`, err);
      const fallbackUrl = `${this.fallbackBackend}${endpoint}`;
      return await firstValueFrom(this.http.post<T>(fallbackUrl, body));
    }
  }

  private async getApi<T>(endpoint: string): Promise<T> {
    try {
      return await firstValueFrom(this.http.get<T>(endpoint));
    } catch (err) {
      console.warn(`Relative API ${endpoint} failed, retrying with live Cloud Run backend...`, err);
      const fallbackUrl = `${this.fallbackBackend}${endpoint}`;
      return await firstValueFrom(this.http.get<T>(fallbackUrl));
    }
  }

  async loadStats(): Promise<void> {
    this.isLoadingStats.set(true);
    try {
      const res = await this.getApi<{ success: boolean } & StatsResponse>('/api/stats');
      if (res && res.totalActivations !== undefined) {
        this.totalActivations.set(res.totalActivations);
        this.totalUsers.set(res.totalUsers);
        this.todayActivations.set(res.todayActivations);
      }
    } catch (err) {
      console.warn('Could not fetch stats:', err);
    } finally {
      this.isLoadingStats.set(false);
    }
  }

  async loadHistory(): Promise<void> {
    this.isLoadingHistory.set(true);
    try {
      const res = await this.getApi<{ success: boolean; history: GlobalRecord[] }>('/api/history');
      if (res && res.history) {
        this.globalHistory.set(res.history);
      }
    } catch (err) {
      console.warn('Could not fetch history:', err);
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  setStep(step: 1 | 2 | 3) {
    this.currentStep.set(step);
    this.statusError.set(null);
  }

  resetActivation() {
    this.currentStep.set(1);
    this.magicLink.set('');
    this.statusError.set(null);
    this.statusSuccess.set(null);
  }

  async sendMagicLink(targetEmail: string): Promise<boolean> {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      this.statusError.set('Format email tidak valid. Masukkan email aktif.');
      return false;
    }

    this.email.set(clean);
    this.isSendingLink.set(true);
    this.statusError.set(null);
    this.statusSuccess.set(null);

    try {
      const res = await this.postApi<{ success: boolean; message: string; email: string }>('/api/send-link', {
        email: clean,
      });

      if (res && res.success) {
        this.statusSuccess.set(res.message || `Magic link berhasil dikirim ke ${clean}. Cek inbox atau folder spam.`);
        this.currentStep.set(2);
        return true;
      } else {
        this.statusError.set(res.message || 'Gagal mengirim magic link.');
        return false;
      }
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Gagal terhubung ke gateway aktivasi. Silakan coba lagi.');
      this.statusError.set(msg);
      return false;
    } finally {
      this.isSendingLink.set(false);
    }
  }

  async verifyMagicLink(link: string): Promise<boolean> {
    const cleanLink = link.trim();
    if (!cleanLink) {
      this.statusError.set('Magic link tidak boleh kosong.');
      return false;
    }

    const currentEmail = this.email();
    if (!currentEmail) {
      this.statusError.set('Email tidak ditemukan. Silakan kembali ke langkah 1.');
      return false;
    }

    this.magicLink.set(cleanLink);
    this.isVerifying.set(true);
    this.statusError.set(null);
    this.statusSuccess.set(null);

    try {
      const res = await this.postApi<{ success: boolean; message: string; data: GlobalRecord & { stats?: StatsSnapshot } }>(
        '/api/verify-link',
        {
          email: currentEmail,
          magicLink: cleanLink,
        }
      );

      if (res && res.success && res.data) {
        this.activeResult.set(res.data);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('premotion_active_session', JSON.stringify(res.data));
          } catch (err) {
            console.debug('Storage save error:', err);
          }
        }

        // Update local stats & history immediately with real values
        if (res.data.stats) {
          this.totalActivations.set(res.data.stats.total);
          this.todayActivations.set(res.data.stats.today);
          if (res.data.stats.users !== undefined) {
            this.totalUsers.set(res.data.stats.users);
          }
        }
        await this.loadHistory();

        this.statusSuccess.set('Verifikasi berhasil! Alight Motion Premium kini aktif.');
        this.currentStep.set(3);
        return true;
      } else {
        this.statusError.set(res.message || 'Verifikasi gagal. Periksa kembali tautan yang dimasukkan.');
        return false;
      }
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Verifikasi gagal atau link kedaluwarsa. Silakan periksa link dari email.');
      this.statusError.set(msg);
      return false;
    } finally {
      this.isVerifying.set(false);
    }
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.error && typeof err.error === 'object' && err.error.message) {
        return err.error.message;
      }
      if (err.status === 404) {
        return 'Endpoint server / API tidak ditemukan (404). Silakan pastikan server backend / Vercel Serverless Function aktif.';
      }
      if (err.status === 0) {
        return 'Tidak dapat terhubung ke server backend (Offline / Network Error).';
      }
      if (typeof err.error === 'string' && err.error.trim()) {
        return err.error;
      }
    } else if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: { message?: string } }).error;
      if (e?.message) return e.message;
    }
    return fallback;
  }
}
