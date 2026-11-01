import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { ActivationState } from '../../services/activation.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [RouterLink, MatIconModule, DatePipe],
  template: `
    <div class="page-enter-animation space-y-6 pb-28 pt-2">
      <!-- Hero Welcome Banner with 16:9 Image -->
      <div class="liquid-glass-card overflow-hidden relative">
        <!-- 16:9 Banner Image Container -->
        <div class="relative w-full aspect-video overflow-hidden rounded-t-2xl bg-slate-900 border-b border-white/10">
          <img
            src="https://i.imgur.com/AMySnri.png"
            alt="Premotion Alight Motion 1 Year Banner"
            class="w-full h-full object-cover"
            referrerpolicy="no-referrer"
          />
        </div>

        <div class="p-6 md:p-8 relative z-10">
          <div class="space-y-2.5">
            <!-- Mandatory Requested Title: Aktivasi Alight Motion Premium 1 Tahun -->
            <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Aktivasi Alight Motion Premium 1 Tahun
            </h1>

            <p class="text-slate-200 text-sm leading-relaxed">
              Sistem aktivasi otomatis dengan protokol reverse engineering mendalam. Cukup masukkan email, klik magic link, dan Premium terpasang langsung ke akun Anda.
            </p>
          </div>
        </div>
      </div>

      <!-- Real Cards (NO SIMULASI): [Total Activation] & [Total Pengguna] -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <!-- Card [Total Activation] -->
        <div class="liquid-glass-card p-6 relative">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="text-emerald-400 text-sm">verified</mat-icon>
                Total Activation
              </span>
              <div class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-1 font-mono">
                {{ state.totalActivations().toLocaleString('id-ID') }}
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <mat-icon>flash_on</mat-icon>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-200">
            <div class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Hari ini: <strong class="text-emerald-300 font-mono">+{{ state.todayActivations().toLocaleString('id-ID') }}</strong></span>
            </div>
            <span class="text-emerald-400 font-semibold">Data Riil Global</span>
          </div>
        </div>

        <!-- Card [Total Pengguna] -->
        <div class="liquid-glass-card p-6 relative">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <span class="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <mat-icon class="text-teal-300 text-sm">group</mat-icon>
                Total Pengguna
              </span>
              <div class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-1 font-mono">
                {{ state.totalUsers().toLocaleString('id-ID') }}
              </div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <mat-icon>groups</mat-icon>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-200">
            <div class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-teal-300"></span>
              <span>Pengguna Unik</span>
            </div>
            <span class="text-teal-300 font-semibold">Terverifikasi</span>
          </div>
        </div>
      </div>

      <!-- Feature Highlight Cards (No gradients, no gray) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="liquid-glass-card p-5 flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <mat-icon>mark_email_read</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Magic Link Login</h3>
            <p class="text-xs text-slate-200 mt-1 leading-relaxed">
              Cukup masukkan alamat email. Tautan login dikirim resmi tanpa perlu memasukkan password.
            </p>
          </div>
        </div>

        <div class="liquid-glass-card p-5 flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <mat-icon>workspace_premium</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Premium 1 Tahun</h3>
            <p class="text-xs text-slate-200 mt-1 leading-relaxed">
              Verifikasi Cloud Function resmi dengan Order ID berformat unik <code class="text-emerald-300 font-mono">Premotion - *******</code>.
            </p>
          </div>
        </div>

        <div class="liquid-glass-card p-5 flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <mat-icon>security</mat-icon>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Stealth Headers Android</h3>
            <p class="text-xs text-slate-200 mt-1 leading-relaxed">
              Menyamar 100% sebagai aplikasi Android asli Alight Creative dengan sertifikat resmi.
            </p>
          </div>
        </div>
      </div>

      <!-- Real Global Community Feed (NO SIMULATION) -->
      <div class="liquid-glass-card p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-400">history</mat-icon>
            <h2 class="text-base font-bold text-white">Aktivasi Komunitas Terbaru</h2>
          </div>
          <a routerLink="/history" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <span>Buka History</span>
            <mat-icon class="text-xs">chevron_right</mat-icon>
          </a>
        </div>

        <div class="space-y-2.5">
          @for (item of state.recentActivations(); track item.orderId) {
            <div class="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <mat-icon class="text-base">check_circle</mat-icon>
                </div>
                <div class="min-w-0">
                  <div class="font-mono font-medium text-white truncate">{{ item.maskedEmail }}</div>
                  <div class="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                    <span class="text-emerald-400 font-bold">{{ item.orderId }}</span>
                    <span>&bull;</span>
                    <span>{{ item.activatedAt | date:'HH:mm' }} WIB</span>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="p-8 text-center text-slate-300 text-xs space-y-2">
              <mat-icon class="text-slate-400 text-2xl">history_toggle_off</mat-icon>
              <div class="font-semibold text-white">Belum Ada Riwayat Aktivasi</div>
              <p class="text-slate-300 max-w-sm mx-auto">
                Riwayat ini bersifat riil dan belum ada akun yang diaktifkan. Klik Mulai Aktivasi untuk menjadi yang pertama.
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Home {
  readonly state = inject(ActivationState);
}
