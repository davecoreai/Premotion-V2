import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { ActivationState } from './services/activation.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly state = inject(ActivationState);
  private router = inject(Router);

  // Active tab index for sliding pill animation (0: Home, 1: Activation, 2: History)
  readonly activeTabIndex = signal<number>(0);

  // Tracks virtual keyboard open on mobile
  readonly isKeyboardOpen = signal<boolean>(false);

  constructor() {
    this.updateTabFromUrl(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateTabFromUrl(event.urlAfterRedirects || event.url);
      });

    if (typeof window !== 'undefined') {
      const checkKeyboard = () => {
        if (window.visualViewport) {
          const isKb = (window.innerHeight - window.visualViewport.height) > 120;
          this.isKeyboardOpen.set(isKb);
        } else {
          const activeTag = document.activeElement?.tagName;
          this.isKeyboardOpen.set(activeTag === 'INPUT' || activeTag === 'TEXTAREA');
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', checkKeyboard);
        window.visualViewport.addEventListener('scroll', checkKeyboard);
      }

      window.addEventListener('resize', checkKeyboard);

      window.addEventListener('focusin', (e) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          checkKeyboard();
        }
      });

      window.addEventListener('focusout', () => {
        setTimeout(() => checkKeyboard(), 150);
      });
    }
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouch(event: TouchEvent) {
    const target = event.target as HTMLElement;
    if (target && !['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'LABEL', 'MAT-ICON'].includes(target.tagName)) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  private updateTabFromUrl(url: string) {
    if (url.includes('activation')) {
      this.activeTabIndex.set(1);
    } else if (url.includes('history')) {
      this.activeTabIndex.set(2);
    } else {
      this.activeTabIndex.set(0); // Home
    }
  }
}
