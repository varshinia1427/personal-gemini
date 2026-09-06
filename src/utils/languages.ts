import type { LanguageCode, LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechCode: 'fr-FR', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', speechCode: 'de-DE', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', speechCode: 'ja-JP', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', speechCode: 'ko-KR', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechCode: 'ar-SA', dir: 'rtl' },
];

export function getLanguageOption(code?: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export function getLanguageName(code?: string): string {
  const lang = getLanguageOption(code);
  return `${lang.name} (${lang.nativeName})`;
}
