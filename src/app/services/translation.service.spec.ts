import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach((): void => {
    localStorage.clear();
    service = new TranslationService();
  });

  it('should expose the supported language list', (): void => {
    expect(service.getSupportedLanguages().map((language) => language.code)).toContain('de');
  });

  it('should normalize language codes and rtl state', (): void => {
    expect(service.normalizeLanguageCode('de-DE')).toBe('de');
    expect(service.normalizeLanguageCode(undefined)).toBe('en');
    expect(service.isRightToLeft('ar-EG')).toBe(true);
    expect(service.isRightToLeft('de-DE')).toBe(false);
  });

  it('should resolve the first supported language', (): void => {
    expect(service.resolveLanguage(['xx-YY', 'pt-BR'])).toBe('pt');
    expect(service.resolveLanguage(['xx-YY'])).toBe('en');
  });

  it('should load the requested language dictionary', async (): Promise<void> => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request): Promise<Response> => {
      expect(String(input)).toBe('/i18n/de.json');
      return {
        json: async (): Promise<{ languageName: string; labels: Record<string, string> }> => ({
          languageName: 'Deutsch',
          labels: { 'stats.completedExams': 'Abgeschlossene Prüfungen' },
        }),
      } as Response;
    });

    const dictionary = await service.loadLanguage('de-DE');

    expect(dictionary.languageName).toBe('Deutsch');
  });

  it('should fallback to english when the requested language fails', async (): Promise<void> => {
    globalThis.fetch = vi.fn(async (input: string | URL | Request): Promise<Response> => {
      const url = String(input);
      if (url === '/i18n/de.json') {
        throw new Error('broken');
      }
      return {
        json: async (): Promise<{ languageName: string; labels: Record<string, string> }> => ({
          languageName: 'English',
          labels: { 'stats.completedExams': 'Completed exams' },
        }),
      } as Response;
    });

    const dictionary = await service.loadLanguage('de');

    expect(globalThis.fetch).toHaveBeenCalledWith('/i18n/en.json');
    expect(dictionary.languageName).toBe('English');
  });

  it('should throw when the fallback dictionary also fails', async (): Promise<void> => {
    globalThis.fetch = vi.fn(async (): Promise<Response> => {
      throw new Error('broken');
    });

    await expect(service.loadLanguage('en')).rejects.toThrowError('Unable to load the fallback translation dictionary.');
  });

  it('should translate keys with placeholders', (): void => {
    expect(service.translate({ languageName: 'English', labels: { greeting: 'Hello {name}' } }, 'greeting', { name: 'Edward' })).toBe('Hello Edward');
    expect(service.translate({ languageName: 'English', labels: {} }, 'missing.key')).toBe('missing.key');
  });

  it('should persist and retrieve the stored language', (): void => {
    expect(service.getStoredLanguage()).toBeNull();
    service.setStoredLanguage('de-DE');
    expect(service.getStoredLanguage()).toBe('de');
  });

  it('should safely handle missing localStorage', (): void => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });

    expect(service.getStoredLanguage()).toBeNull();
    expect((): void => service.setStoredLanguage('de')).not.toThrow();

    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    }
  });
}
);
