"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n/translations';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Try to get saved language or default to 'en'
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('umurage_lang') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'rw' || savedLang === 'fr')) {
            setLanguageState(savedLang);
        } else if (typeof window !== 'undefined') {
            // Optional: Detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'fr') setLanguageState('fr');
            // 'rw' is usually not detected this way easily, but we could try
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('umurage_lang', lang);
        // Add a nice transition effect if needed
        document.documentElement.lang = lang;
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current && current[key] !== undefined) {
                current = current[key];
            } else {
                // Fallback to English if key missing in current language
                let fallback: any = translations['en'];
                for (const fallbackKey of keys) {
                    if (fallback && fallback[fallbackKey] !== undefined) {
                        fallback = fallback[fallbackKey];
                    } else {
                        return path; // Final fallback: return the key itself
                    }
                }
                return fallback;
            }
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
