import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivationState } from '../../services/activation.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-history',
  imports: [RouterLink, MatIconModule, DatePipe, ReactiveFormsModule],
  template: `
    <div class="page-enter-animation space-y-6 pb-28 pt-2">
      <!-- Simple History Title Only -->
      <div class="px-2 pt-2">
        <h1 class="text-2xl md:text-3xl font-extrabold text-white">History</h1>
      </div>

      <!-- Telegram Bot Settings Card (Collapsible) -->
      @if (showTelegramSettings()) {
        <div class="liquid-glass-card p-6 space-y-5 border-emerald-500/30">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2">
              <mat-icon class="text-emerald-400">send</mat-icon>
              <h2 class="text-sm font-bold text-white">Pengaturan Bot Telegram</h2>
            </div>
            <span
              class="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/10"
              [class.bg-emerald-500]="hasTelegramConfig()"
              [class.text-slate-950]="hasTelegramConfig()"
              [class.bg-slate-800]="!hasTelegramConfig()"
              [class.text-slate-400]="!hasTelegramConfig()"
            >
              {{ hasTelegramConfig() ? 'BOT AKTIF' : 'BELUM KONFIGURASI' }}
            </span>
          </div>

          <!-- Alert status -->
          @if (telegramStatusMsg()) {
            <div
              class="p-3 rounded-xl text-xs flex items-center gap-2 border border-white/10"
              [class.bg-emerald-950]="isStatusSuccess()"
              [class.text-emerald-200]="isStatusSuccess()"
              [class.bg-red-950]="!isStatusSuccess()"
              [class.text-red-200]="!isStatusSuccess()"
            >
              <mat-icon class="text-sm shrink-0">{{ isStatusSuccess() ? 'check_circle' : 'error' }}</mat-icon>
              <span>{{ telegramStatusMsg() }}</span>
            </div>
          }

          <form [formGroup]="telegramForm" (ngSubmit)="saveTelegramSettings()" class="space-y-4 text-xs">
            <div class="space-y-1.5">
              <label htmlFor="botToken" class="font-bold text-slate-200">Bot Token (dari &#64;BotFather)</label>
              <input
                id="botToken"
                type="text"
                formControlName="botToken"
                placeholder="Contoh: 1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div class="space-y-1.5">
              <label htmlFor="chatId" class="font-bold text-slate-200">Chat ID (Group / Channel / Chat ID)</label>
              <input
                id="chatId"
                type="text"
                formControlName="chatId"
                placeholder="Contoh: -100123456789 atau 123456789"
                class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div class="p-3 rounded-xl bg-slate-900/80 border border-white/10 text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <div class="font-bold text-emerald-400 flex items-center gap-1">
                <mat-icon class="text-xs">info</mat-icon>
                <span>Fungsi Otomatis Bot Telegram:</span>
              </div>
              <p>&bull; <strong>Notifikasi Real-time:</strong> Mengirim rincian pesan saat ada aktivasi history baru.</p>
              <p>&bull; <strong>Laporan Otomatis 5 Menit:</strong> Mengirim pembaruan statistik rutin (<code>Total Pengguna : X</code> dan <code>Total Aktivasi : Y</code>) setiap 5 menit.</p>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <button
                type="submit"
                [disabled]="telegramForm.invalid || isSavingTelegram()"
                class="liquid-glass-btn-primary px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <mat-icon class="text-sm">save</mat-icon>
                <span>{{ isSavingTelegram() ? 'Menyimpan...' : 'Simpan Konfirmasi' }}</span>
              </button>

              <button
                type="button"
                (click)="testTelegramBot()"
                [disabled]="!hasTelegramConfig() || isTestingTelegram()"
                class="liquid-glass-btn-secondary px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <mat-icon class="text-sm text-emerald-400">send</mat-icon>
                <span>{{ isTestingTelegram() ? 'Mengirim Test...' : 'Kirim Pesan Tes' }}</span>
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Real History List -->
      <div class="space-y-3">
        @for (item of state.globalHistory(); track item.orderId) {
          <div class="liquid-glass-card p-5 hover:border-emerald-500/40 transition-all">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2.5">
                  <!-- Order ID -->
                  <div class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <mat-icon class="text-xs">tag</mat-icon>
                    <span>{{ item.orderId }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 text-xs text-slate-200 font-mono">
                  <mat-icon class="text-emerald-400 text-sm">alternate_email</mat-icon>
                  <span>{{ item.maskedEmail }}</span>
                </div>
              </div>

              <!-- Timestamp -->
              <div class="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                <div class="text-[11px] text-slate-300 font-medium">Diaktifkan</div>
                <div class="text-xs font-mono font-bold text-white">
                  {{ item.activatedAt | date:'dd MMM yyyy, HH:mm' }} WIB
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="liquid-glass-card p-12 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <mat-icon class="text-2xl">receipt_long</mat-icon>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-white">Belum Ada Riwayat Aktivasi</h3>
              <p class="text-xs text-slate-200 max-w-sm mx-auto leading-relaxed">
                Database saat ini belum memiliki data aktivasi. Lakukan aktivasi untuk mencatatkan Order ID Anda di sini!
              </p>
            </div>
            <div class="pt-2">
              <a
                routerLink="/activation"
                class="liquid-glass-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <mat-icon class="text-sm">bolt</mat-icon>
                <span>Mulai Aktivasi Sekarang</span>
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class History implements OnInit {
  readonly state = inject(ActivationState);
  private http = inject(HttpClient);

  readonly showTelegramSettings = signal<boolean>(false);
  readonly hasTelegramConfig = signal<boolean>(false);
  readonly isSavingTelegram = signal<boolean>(false);
  readonly isTestingTelegram = signal<boolean>(false);
  readonly telegramStatusMsg = signal<string | null>(null);
  readonly isStatusSuccess = signal<boolean>(true);

  readonly telegramForm = new FormGroup({
    botToken: new FormControl('', [Validators.required]),
    chatId: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    this.loadTelegramConfig();
  }

  loadTelegramConfig() {
    this.http.get<{
      success: boolean;
      botToken: string;
      chatId: string;
      hasToken: boolean;
    }>('/api/telegram/config').subscribe({
      next: (res) => {
        if (res.success) {
          this.hasTelegramConfig.set(res.hasToken);
          if (res.chatId) {
            this.telegramForm.patchValue({ chatId: res.chatId });
          }
        }
      },
      error: (err) => {
        console.debug('Failed to load Telegram config:', err);
      },
    });
  }

  saveTelegramSettings() {
    if (this.telegramForm.invalid) return;

    this.isSavingTelegram.set(true);
    this.telegramStatusMsg.set(null);

    const val = this.telegramForm.value;

    this.http.post<{
      success: boolean;
      message: string;
      config: { hasToken: boolean };
    }>('/api/telegram/config', {
      botToken: val.botToken,
      chatId: val.chatId,
      enabled: true,
    }).subscribe({
      next: (res) => {
        this.isSavingTelegram.set(false);
        if (res.success) {
          this.hasTelegramConfig.set(res.config.hasToken);
          this.isStatusSuccess.set(true);
          this.telegramStatusMsg.set(res.message || 'Konfigurasi Telegram berhasil disimpan!');
        }
      },
      error: (err) => {
        this.isSavingTelegram.set(false);
        this.isStatusSuccess.set(false);
        this.telegramStatusMsg.set(err.error?.message || 'Gagal menyimpan konfigurasi Telegram.');
      },
    });
  }

  testTelegramBot() {
    this.isTestingTelegram.set(true);
    this.telegramStatusMsg.set(null);

    this.http.post<{
      success: boolean;
      message: string;
    }>('/api/telegram/test', {}).subscribe({
      next: (res) => {
        this.isTestingTelegram.set(false);
        this.isStatusSuccess.set(true);
        this.telegramStatusMsg.set(res.message || 'Pesan tes berhasil dikirim!');
      },
      error: (err) => {
        this.isTestingTelegram.set(false);
        this.isStatusSuccess.set(false);
        this.telegramStatusMsg.set(err.error?.message || 'Gagal mengirim pesan tes ke Telegram.');
      },
    });
  }
}
