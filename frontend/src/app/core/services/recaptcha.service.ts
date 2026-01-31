import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class RecaptchaService {
  private loaded = signal(false);
  private siteKey = environment.recaptchaSiteKey;

  isEnabled(): boolean {
    return !!this.siteKey;
  }

  async loadScript(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (this.loaded()) {
      return;
    }

    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="recaptcha"]')) {
        this.loaded.set(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.loaded.set(true);
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  async execute(action: string): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }

    await this.loadScript();

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(this.siteKey, { action });
          resolve(token);
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          reject(error);
        }
      });
    });
  }
}
