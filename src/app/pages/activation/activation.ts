import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivationState } from '../../services/activation.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-activation',
  imports: [ReactiveFormsModule, MatIconModule, RouterLink],
  template: `
    <div class="page-enter-animation space-y-6 pb-28 pt-2">
      <!-- Progress Bar 1 ------ 2 ----- 3 -->
      <div class="liquid-glass-card p-4 md:p-5">
        <div class="flex items-center justify-between max-w-md mx-auto relative">
          <!-- Step 1 Indicator -->
          <div class="flex flex-col items-center gap-1.5 z-10 pointer-events-none select-none">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200"
              [class.bg-emerald-500]="state.currentStep() >= 1"
              [class.text-slate-950]="state.currentStep() >= 1"
              [class.shadow-[0_0_15px_rgba(16,185,129,0.5)]]="state.currentStep() === 1"
              [class.bg-slate-900]="state.currentStep() < 1"
              [class.text-slate-400]="state.currentStep() < 1"
            >
              @if (state.currentStep() > 1) {
                <mat-icon class="text-base">check</mat-icon>
              } @else {
                1
              }
            </div>
            <span
              class="text-xs font-bold tracking-wide"
              [class.text-emerald-400]="state.currentStep() === 1"
              [class.text-white]="state.currentStep() > 1"
              [class.text-slate-300]="state.currentStep() < 1"
            >
              Email
            </span>
          </div>

          <!-- Connector 1 to 2 -->
          <div class="flex-1 mx-2 sm:mx-4 h-1 relative overflow-hidden rounded-full bg-slate-900 border border-white/10">
            <div
              class="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              [style.width]="state.currentStep() >= 2 ? '100%' : '0%'"
            ></div>
          </div>

          <!-- Step 2 Indicator -->
          <div class="flex flex-col items-center gap-1.5 z-10 pointer-events-none select-none">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200"
              [class.bg-emerald-500]="state.currentStep() >= 2"
              [class.text-slate-950]="state.currentStep() >= 2"
              [class.shadow-[0_0_15px_rgba(16,185,129,0.5)]]="state.currentStep() === 2"
              [class.bg-slate-900]="state.currentStep() < 2"
              [class.text-slate-400]="state.currentStep() < 2"
            >
              @if (state.currentStep() > 2) {
                <mat-icon class="text-base">check</mat-icon>
              } @else {
                2
              }
            </div>
            <span
              class="text-xs font-bold tracking-wide"
              [class.text-emerald-400]="state.currentStep() === 2"
              [class.text-white]="state.currentStep() > 2"
              [class.text-slate-300]="state.currentStep() < 2"
            >
              Magic Link
            </span>
          </div>

          <!-- Connector 2 to 3 -->
          <div class="flex-1 mx-2 sm:mx-4 h-1 relative overflow-hidden rounded-full bg-slate-900 border border-white/10">
            <div
              class="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              [style.width]="state.currentStep() >= 3 ? '100%' : '0%'"
            ></div>
          </div>

          <!-- Step 3 Indicator -->
          <div class="flex flex-col items-center gap-1.5 z-10 pointer-events-none select-none">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200"
              [class.bg-emerald-500]="state.currentStep() === 3"
              [class.text-slate-950]="state.currentStep() === 3"
              [class.shadow-[0_0_15px_rgba(16,185,129,0.5)]]="state.currentStep() === 3"
              [class.bg-slate-900]="state.currentStep() < 3"
              [class.text-slate-400]="state.currentStep() < 3"
            >
              3
            </div>
            <span
              class="text-xs font-bold tracking-wide"
              [class.text-emerald-400]="state.currentStep() === 3"
              [class.text-slate-300]="state.currentStep() < 3"
            >
              Confirm
            </span>
          </div>
        </div>
      </div>

      <!-- Error / Success Alert Notification -->
      @if (state.statusError()) {
        <div class="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-3">
          <mat-icon class="text-red-400 shrink-0 text-base">error_outline</mat-icon>
          <div class="flex-1">{{ state.statusError() }}</div>
          <button (click)="state.statusError.set(null)" class="text-red-300 hover:text-white">
            <mat-icon class="text-xs">close</mat-icon>
          </button>
        </div>
      }

      @if (state.statusSuccess() && state.currentStep() !== 3) {
        <div class="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-3">
          <mat-icon class="text-emerald-400 shrink-0 text-base">check_circle</mat-icon>
          <div class="flex-1">{{ state.statusSuccess() }}</div>
        </div>
      }

      <!-- STEP 1: Masukan Email -->
      @if (state.currentStep() === 1) {
        <div class="liquid-glass-card step-enter-animation p-6 md:p-8 space-y-6">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <mat-icon class="text-sm">mail</mat-icon>
              <span>Langkah 1 &bull; Autentikasi Akun</span>
            </div>
            <h2 class="text-xl md:text-2xl font-extrabold text-white">Masukan Email</h2>
            <p class="text-xs text-slate-200 leading-relaxed">
              Ketik email akun Alight Motion Anda. Kami akan mengirimkan tautan login resmi (Magic Link) tanpa perlu kata sandi.
            </p>
          </div>

          <form [formGroup]="emailForm" (ngSubmit)="submitEmail()" class="space-y-4">
            <div class="space-y-2">
              <label for="account-email" class="block text-xs font-bold text-white tracking-wide uppercase">
                Alamat Email Akun
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="account-email"
                  type="email"
                  formControlName="email"
                  placeholder="premotion@gmail.com"
                  class="liquid-glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium"
                />
              </div>
              @if (emailControl.invalid && emailControl.touched) {
                <p class="text-[11px] text-red-400 font-medium">Masukkan format email yang valid.</p>
              }
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="emailForm.invalid || state.isSendingLink()"
                class="liquid-glass-btn-primary w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (state.isSendingLink()) {
                  <mat-icon class="animate-spin text-sm">autorenew</mat-icon>
                  <span>Mengirim Link...</span>
                } @else {
                  <mat-icon class="text-sm">send</mat-icon>
                  <span>Kirim Magic Link &rarr;</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- STEP 2: Masukan Magic Link -->
      @if (state.currentStep() === 2) {
        <div class="liquid-glass-card step-enter-animation p-6 md:p-8 space-y-6">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <mat-icon class="text-sm">link</mat-icon>
              <span>Langkah 2 &bull; Verifikasi Tautan</span>
            </div>
            <h2 class="text-xl md:text-2xl font-extrabold text-white">Masukan Magic Link</h2>
            <p class="text-xs text-slate-200 leading-relaxed">
              Magic Link telah dikirim ke <strong class="text-emerald-400 font-mono">{{ state.email() }}</strong>. Buka email Anda, salin seluruh tautan atau kode oobCode, lalu tempel di sini.
            </p>
          </div>

          <form [formGroup]="magicLinkForm" (ngSubmit)="submitMagicLink()" class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for="magic-link-input" class="block text-xs font-bold text-white tracking-wide uppercase">
                  Tautan Verifikasi / Magic Link
                </label>
                <button
                  type="button"
                  (click)="pasteFromClipboard()"
                  class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <mat-icon class="text-xs">content_paste</mat-icon>
                  <span>Tempel Link</span>
                </button>
              </div>

              <textarea
                id="magic-link-input"
                formControlName="magicLink"
                rows="3"
                placeholder="https://alightcreative.com/__/auth/action?mode=signIn&oobCode=... atau tempel oobCode"
                class="liquid-glass-input w-full p-3.5 rounded-xl text-xs font-mono resize-none font-medium"
              ></textarea>
              @if (linkControl.invalid && linkControl.touched) {
                <p class="text-[11px] text-red-400 font-medium">Tautan atau kode magic link wajib diisi.</p>
              }
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                (click)="goToStep(1)"
                class="liquid-glass-btn-secondary flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-bold cursor-pointer"
              >
                <mat-icon class="text-sm">arrow_back</mat-icon>
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                [disabled]="magicLinkForm.invalid || state.isVerifying()"
                class="liquid-glass-btn-primary flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (state.isVerifying()) {
                  <mat-icon class="animate-spin text-sm">autorenew</mat-icon>
                  <span>Mengaktifkan Premium...</span>
                } @else {
                  <mat-icon class="text-sm">verified</mat-icon>
                  <span>Verifikasi & Aktifkan &rarr;</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- STEP 3: Confirm -->
      @if (state.currentStep() === 3 && state.activeResult(); as result) {
        <div class="liquid-glass-card step-enter-animation p-6 md:p-8 space-y-6">
          <!-- Header without "AKTIVASI SUKSES • PREMIUM AKTIF" and without "Card [Confirm]" -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <h2 class="text-xl md:text-2xl font-extrabold text-white">Konfirmasi</h2>

            <!-- Order ID: Premotion - ******* -->
            <div class="p-3 rounded-xl bg-slate-900 border border-white/15 flex flex-col items-start sm:items-end">
              <span class="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Order ID Resmi</span>
              <div class="text-emerald-400 font-mono font-bold text-base md:text-lg flex items-center gap-2 mt-0.5">
                <span>{{ result.orderId }}</span>
                <button
                  type="button"
                  (click)="copyText(result.orderId)"
                  class="p-1 rounded hover:bg-white/10 text-emerald-400 hover:text-white transition-colors"
                  title="Salin Order ID"
                >
                  <mat-icon class="text-sm">content_copy</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Details grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-1">
              <span class="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Akun Terdaftar</span>
              <div class="text-sm font-bold text-white font-mono break-all">{{ result.email }}</div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-1">
              <span class="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Status Langganan</span>
              <div class="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <mat-icon class="text-base">verified</mat-icon>
                <span>Yearly Premium (1 Tahun)</span>
              </div>
            </div>

            <div class="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-1">
              <span class="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">Masa Berlaku Hingga</span>
              <div class="text-sm font-bold text-white font-mono">{{ result.validUntil }}</div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <a
              routerLink="/history"
              class="liquid-glass-btn-primary flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold cursor-pointer"
            >
              <mat-icon class="text-sm">receipt_long</mat-icon>
              <span>Buka History</span>
            </a>

            <button
              type="button"
              (click)="activateAnother()"
              class="liquid-glass-btn-secondary flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              <mat-icon class="text-sm">add_circle_outline</mat-icon>
              <span>Aktivasi Akun Lain</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Activation {
  readonly state = inject(ActivationState);

  emailControl = new FormControl('', [Validators.required, Validators.email]);
  emailForm = new FormGroup({
    email: this.emailControl,
  });

  linkControl = new FormControl('', [Validators.required]);
  magicLinkForm = new FormGroup({
    magicLink: this.linkControl,
  });

  constructor() {
    // Keep input field clean without prefilling
  }

  canGoToStep2(): boolean {
    return !!this.state.email();
  }

  goToStep(step: 1 | 2 | 3) {
    if (step === 2 && !this.canGoToStep2()) return;
    if (step === 3 && !this.state.hasActiveLicense()) return;
    this.state.setStep(step);
  }

  async submitEmail() {
    if (this.emailForm.invalid) return;
    const emailVal = this.emailControl.value || '';
    await this.state.sendMagicLink(emailVal);
  }

  async submitMagicLink() {
    if (this.magicLinkForm.invalid) return;
    const linkVal = this.linkControl.value || '';
    await this.state.verifyMagicLink(linkVal);
  }

  async pasteFromClipboard() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.linkControl.setValue(text.trim());
        }
      } catch (err) {
        console.warn('Clipboard read failed:', err);
      }
    }
  }

  copyText(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  activateAnother() {
    this.state.resetActivation();
    this.emailControl.reset();
    this.linkControl.reset();
  }
}
