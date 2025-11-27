// Utility Functions - الدوال المساعدة
const Utils = {
    formatDate: (date, lang) => {
        return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
    },
    
    formatCurrency: (num) => {
        return parseFloat(num).toFixed(2);
    },
    
    translate: (ar, en, lang) => {
        return lang === 'ar' ? ar : en;
    },
    
    updateAllTranslations: (lang) => {
        document.querySelectorAll('[data-ar][data-en]').forEach(el => {
            el.textContent = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        });
    },
    
    alert: (message, lang) => {
        alert(message);
    },
    
    confirm: (message) => {
        return confirm(message);
    },
    
    getCurrentFund: (funds, currentFundId) => {
        return funds.find(f => f.id === currentFundId);
    },
    
    downloadFile: (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};
