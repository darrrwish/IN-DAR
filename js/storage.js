// Storage Manager - إدارة تخزين البيانات محليًا
const Storage = {
    KEY: 'investment_app_data',
    
    save: (data) => {
        localStorage.setItem(Storage.KEY, JSON.stringify(data));
    },
    
    load: () => {
        const data = localStorage.getItem(Storage.KEY);
        return data ? JSON.parse(data) : { funds: [], currentFundId: null };
    },
    
    clear: () => {
        localStorage.removeItem(Storage.KEY);
    }
};

// Theme & Language Storage
const Preferences = {
    LANG_KEY: 'app_lang',
    THEME_KEY: 'app_theme',
    
    setLang: (lang) => localStorage.setItem(Preferences.LANG_KEY, lang),
    getLang: () => localStorage.getItem(Preferences.LANG_KEY) || 'ar',
    
    setTheme: (theme) => localStorage.setItem(Preferences.THEME_KEY, theme),
    getTheme: () => localStorage.getItem(Preferences.THEME_KEY) || 'light'
};
