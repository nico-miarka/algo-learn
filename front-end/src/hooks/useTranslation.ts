import { use } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import {
  initReactI18next,
  Trans as TransI18Next,
  useTranslation as useTranslationsI18Next,
} from "react-i18next"

import { Language } from "../../../shared/src/api/Language"
import de from "../locales/de.json"
import en from "../locales/en.json"

void use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["en", "de"],
    detection: {
      order: ["path", "navigator"],
    },
    debug: false,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
  })

// // Default language set in the browser, as determined i18next:
// export const defaultLang =
/**
 * API-compatible shim for `useTranslation` that also returns the language.
 *
 * @returns The translation functions
 */
export function useTranslation() {
  const obj = useTranslationsI18Next()
  const lang: Language = obj.i18n.language === "de" ? "de_DE" : "en_US"
  return { ...obj, lang }
}

export const Trans = TransI18Next
