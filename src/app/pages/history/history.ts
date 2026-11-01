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
  selector: 'app-history',
  imports: [RouterLink, MatIconModule, DatePipe],
  template: `
    <div class="page-enter-animation space-y-6 pb-28 pt-2">
      <!-- Clean History Header (Changed to "History", boxed elements removed) -->
      <div class="liquid-glass-card p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-extrabold text-white">History</h1>
      </div>

      <!-- Real History List (Removed PREMIUM AKTIF, Salin ID, and UID) -->
      <div class="space-y-3">
        @for (item of state.globalHistory(); track item.orderId) {
          <div class="liquid-glass-card p-5 hover:border-emerald-500/40 transition-all">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2.5">
                  <!-- Premotion - ******* Order ID -->
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
export class History {
  readonly state = inject(ActivationState);
}
