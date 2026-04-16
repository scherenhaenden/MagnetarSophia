import { Injectable } from '@angular/core';
import { LanguageOption, TranslationDictionary } from '../models/academic-progress.models';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly fallbackLanguageCode: string = 'en';
  private readonly storageKey: string = 'magnetar-sophia-language';
  private readonly supportedLanguages: LanguageOption[] = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'da', label: 'Dansk' },
    { code: 'pl', label: 'Polski' },
    { code: 'cs', label: 'Čeština' },
    { code: 'zh', label: '中文' },
    { code: 'ar', label: 'العربية' },
    { code: 'ja', label: '日本語' },
    { code: 'ru', label: 'Русский' },
  ];

  public getSupportedLanguages(): LanguageOption[] {
    return [...this.supportedLanguages];
  }

  public normalizeLanguageCode(code: string | null | undefined): string {
    if (!code) {
      return this.fallbackLanguageCode;
    }

    return code.toLowerCase().split(/[-_]/)[0];
  }

  public isRightToLeft(languageCode: string): boolean {
    return this.normalizeLanguageCode(languageCode) === 'ar';
  }

  public resolveLanguage(preferredCodes: ReadonlyArray<string | null | undefined>): string {
    const supportedCodes: Set<string> = new Set(this.supportedLanguages.map((language: LanguageOption) => language.code));
    for (const code of preferredCodes) {
      const normalizedCode: string = this.normalizeLanguageCode(code);
      if (supportedCodes.has(normalizedCode)) {
        return normalizedCode;
      }
    }

    return this.fallbackLanguageCode;
  }

  public async loadLanguage(languageCode: string): Promise<TranslationDictionary> {
    const resolvedLanguageCode: string = this.resolveLanguage([languageCode]);
    try {
      return await this.fetchDictionary(resolvedLanguageCode);
    } catch {
      if (resolvedLanguageCode === this.fallbackLanguageCode) {
        throw new Error('Unable to load the fallback translation dictionary.');
      }

      return this.fetchDictionary(this.fallbackLanguageCode);
    }
  }

  public translate(dictionary: TranslationDictionary, key: string, params: Record<string, string> = {}): string {
    const template: string = dictionary.labels[key] ?? key;
    return Object.entries(params).reduce(
      (result: string, [paramKey, value]: [string, string]) => result.replaceAll(`{${paramKey}}`, value),
      template,
    );
  }

  public getStoredLanguage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.storageKey);
  }

  public setStoredLanguage(languageCode: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, this.resolveLanguage([languageCode]));
  }

  private async fetchDictionary(languageCode: string): Promise<TranslationDictionary> {
    const response: Response = await fetch(`/i18n/${languageCode}.json`);
    return response.json() as Promise<TranslationDictionary>;
  }
}
