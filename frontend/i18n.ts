import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translation from './src/locales/translation.json';
import { NODE_ENV } from './src/config/env.ts';

i18n.use(initReactI18next) // Bind i18next to React
    .init({
        fallbackLng: 'en', // Default language
        lng: 'en', // Initial language
        debug: NODE_ENV, // Enable debug mode
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        resources: {
            en: {
                translation: Object.fromEntries(
                    Object.entries(translation).map(([key, value]) => [
                        key,
                        value.en,
                    ]),
                ),
            },
            tr: {
                translation: Object.fromEntries(
                    Object.entries(translation).map(([key, value]) => [
                        key,
                        value.tr,
                    ]),
                ),
            },
        },
    });

export default i18n;
