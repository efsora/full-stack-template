import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NODE_ENV } from './src/constants/env.ts';
import translation from './src/locales/processed/translation.json';

i18n.use(initReactI18next) // Bind i18next to React
    .init({
        fallbackLng: 'en', // Default language
        lng: (navigator.language || 'en').split('-')[0], // Initial language
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
