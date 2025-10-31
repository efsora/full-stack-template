import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '#constants/languages';

export default function LanguageSelect() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(i18n.language);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value;
        setLanguage(selected);
        i18n.changeLanguage(selected);
    };

    return (
        <>
            <select
                id="language-select"
                value={language}
                onChange={handleChange}
                className="select"
            >
                {LANGUAGES.map(({ code, label }) => (
                    <option key={code} value={code}>
                        {label}
                    </option>
                ))}
            </select>
        </>
    );
}
