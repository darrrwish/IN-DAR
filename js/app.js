// Main Application - التطبيق الرئيسي
const app = {
    // State
    funds: [],
    currentFundId: null,
    lang: 'ar',
    theme: 'light',
    
    // Initialization
    init: function() {
        this.loadData();
        this.setupEventListeners();
        this.applyTheme(this.theme);
        this.applyLang(this.lang);
        this.setToday();
        this.renderAll();
    },
    
    loadData: function() {
        const data = Storage.load();
        this.funds = data.funds || [];
        this.currentFundId = data.currentFundId;
        this.lang = Preferences.getLang();
        this.theme = Preferences.getTheme();
        
        // Default data
        if (this.funds.length === 0) {
            this.funds = [{
                id: '1',
                name: 'صندوق عزيموت',
                code: 'AZM',
                price: 16.5,
                subscriptionFee: 1,
                redemptionFee: 2,
                transactions: [
                    { date: '2025-01-15', type: 'buy', units: 100, price: 15.5 }
                ],
                priceHistory: [
                    { date: '2025-01-15', price: 15.5 },
                    { date: new Date().toISOString().split('T')[0], price: 16.5 }
                ]
            }];
            this.currentFundId = '1';
            this.saveData();
        }
    },
    
    saveData: function() {
        Storage.save({
            funds: this.funds,
            currentFundId: this.currentFundId
        });
    },
    
    setupEventListeners: function() {
        document.getElementById('fund-select').addEventListener('change', (e) => {
            this.currentFundId = e.target.value;
            this.updateFundDisplay();
            this.updatePortfolio();
            this.renderTransactionsTable();
            this.saveData();
        });
    },
    
    setToday: function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tx-date').value = today;
        document.getElementById('price-date').value = today;
        document.getElementById('today-date').textContent = Utils.formatDate(today, this.lang);
    },
    
    // Theme Management
    toggleTheme: function() {
        this.applyTheme(this.theme === 'light' ? 'dark' : 'light');
    },
    
    applyTheme: function(newTheme) {
        this.theme = newTheme;
        document.body.setAttribute('data-theme', this.theme);
        document.getElementById('theme-icon').className = 
            this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        Preferences.setTheme(this.theme);
    },
    
    // Language Management
    toggleLanguage: function() {
        this.applyLang(this.lang === 'ar' ? 'en' : 'ar');
    },
    
    applyLang: function(newLang) {
        this.lang = newLang;
        document.body.setAttribute('data-lang', this.lang);
        document.documentElement.lang = this.lang;
        document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
        Preferences.setLang(this.lang);
        Utils.updateAllTranslations(this.lang);
    },
    
    // Tab Management
    switchTab: function(tabName) {
        document.querySelectorAll('.content').forEach(el => 
            el.classList.remove('active')
        );
        document.querySelectorAll('.tab-btn').forEach(el => 
            el.classList.remove('active')
        );
        document.getElementById(tabName).classList.add('active');
        event.target.closest('.tab-btn').classList.add('active');
    },
    
    // Fund Modal
    showAddFundModal: function() {
        document.getElementById('fundModal').classList.add('active');
        document.getElementById('price-fund-name').value = 
            Utils.getCurrentFund(this.funds, this.currentFundId)?.name || '';
    },
    
    closeFundModal: function() {
        document.getElementById('fundModal').classList.remove('active');
        document.getElementById('fund-name').value = '';
        document.getElementById('fund-code').value = '';
        document.getElementById('fund-price').value = '';
        document.getElementById('fund-sub-fee').value = '0';
        document.getElementById('fund-red-fee').value = '0';
    },
    
    // Fund Management
    addFund: function() {
        const name = document.getElementById('fund-name').value.trim();
        const code = document.getElementById('fund-code').value.trim().toUpperCase();
        const price = parseFloat(document.getElementById('fund-price').value) || 0;
        const subFee = parseFloat(document.getElementById('fund-sub-fee').value) || 0;
        const redFee = parseFloat(document.getElementById('fund-red-fee').value) || 0;
        
        if (!name || !code || price <= 0) {
            alert(Utils.translate('الرجاء ملء البيانات الصحيحة', 'Please fill correct data', this.lang));
            return;
        }
        
        const fund = {
            id: Date.now().toString(),
            name, code, price,
            subscriptionFee: subFee,
            redemptionFee: redFee,
            transactions: [],
            priceHistory: [{ date: new Date().toISOString().split('T')[0], price }]
        };
        
        this.funds.push(fund);
        this.currentFundId = fund.id;
        this.saveData();
        this.renderAll();
        this.closeFundModal();
    },
    
    deleteFund: function(id) {
        if (this.funds.length === 1) {
            alert(Utils.translate('لا يمكن حذف الصندوق الوحيد', 'Cannot delete only fund', this.lang));
            return;
        }
        if (!confirm(Utils.translate('هل تريد حذف الصندوق؟', 'Delete this fund?', this.lang))) return;
        
        this.funds = this.funds.filter(f => f.id !== id);
        if (this.currentFundId === id) this.currentFundId = this.funds[0]?.id;
        this.saveData();
        this.renderAll();
    },
    
    renderFundSelector: function() {
        const select = document.getElementById('fund-select');
        select.innerHTML = '';
        this.funds.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.name} (${f.code})`;
            select.appendChild(opt);
        });
        if (this.currentFundId) select.value = this.currentFundId;
        this.updateFundDisplay();
    },
    
    updateFundDisplay: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        document.getElementById('current-fund-display').textContent = 
            fund ? `${fund.name} (${fund.code})` : '--';
        if (fund) {
            document.getElementById('price-fund-name').value = fund.name;
        }
    },
    
    renderFundsTable: function() {
        const tbody = document.getElementById('funds-table');
        tbody.innerHTML = '';
        this.funds.forEach(f => {
            const tr = document.createElement('tr');
            const fees = `${f.subscriptionFee || 0}% / ${f.redemptionFee || 0}%`;
            tr.innerHTML = `
                <td>${f.name}</td>
                <td>${f.code}</td>
                <td>${Utils.formatCurrency(f.price)}</td>
                <td>${fees}</td>
                <td><button class="btn-icon danger" style="padding:4px 8px;font-size:11px;" onclick="app.deleteFund('${f.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    },
    
    // Transaction Management
    addTransaction: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        if (!fund) {
            alert(Utils.translate('اختر صندوق أولاً', 'Select a fund first', this.lang));
            return;
        }
        
        const date = document.getElementById('tx-date').value;
        const type = document.getElementById('tx-type').value;
        const units = parseInt(document.getElementById('tx-units').value) || 0;
        const price = parseFloat(document.getElementById('tx-price').value) || 0;
        
        if (!date || units <= 0 || price <= 0) {
            alert(Utils.translate('الرجاء ملء البيانات الصحيحة', 'Please fill correct data', this.lang));
            return;
        }
        
        fund.transactions.push({ date, type, units, price });
        this.clearTxForm();
        this.saveData();
        this.renderAll();
    },
    
    deleteTransaction: function(idx) {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        if (confirm(Utils.translate('هل تريد حذف المعاملة؟', 'Delete transaction?', this.lang))) {
            fund.transactions.splice(idx, 1);
            this.saveData();
            this.renderAll();
        }
    },
    
    clearTxForm: function() {
        document.getElementById('tx-units').value = '';
        document.getElementById('tx-price').value = '';
        this.setToday();
    },
    
    renderTransactionsTable: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        const tbody = document.getElementById('transactions-table');
        tbody.innerHTML = '';
        
        if (!fund) return;
        
        fund.transactions.forEach((tx, idx) => {
            const amount = tx.units * tx.price;
            const fee = tx.type === 'buy' 
                ? amount * (fund.subscriptionFee / 100) 
                : amount * (fund.redemptionFee / 100);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Utils.formatDate(tx.date, this.lang)}</td>
                <td><span class="badge">${tx.type === 'buy' ? '🔽' : '🔼'} ${tx.type === 'buy' ? 'شراء' : 'بيع'}</span></td>
                <td>${tx.units}</td>
                <td>${Utils.formatCurrency(tx.price)}</td>
                <td>${Utils.formatCurrency(amount)}</td>
                <td>${Utils.formatCurrency(fee)}</td>
                <td><button class="btn-icon danger" style="padding:4px 8px;font-size:11px;" onclick="app.deleteTransaction(${idx})"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    },
    
    // Calculations
    calculateMetrics: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        if (!fund) return { units: 0, avgPrice: 0, value: 0, invested: 0, profit: 0, returnPct: 0 };
        
        let units = 0, invested = 0, buyUnits = 0, buyAmount = 0;
        
        fund.transactions.forEach(tx => {
            const amount = tx.units * tx.price;
            const fee = tx.type === 'buy' 
                ? amount * (fund.subscriptionFee / 100) 
                : amount * (fund.redemptionFee / 100);
            const net = amount - fee;
            
            if (tx.type === 'buy') {
                units += tx.units;
                invested += net;
                buyUnits += tx.units;
                buyAmount += net;
            } else {
                units -= tx.units;
                invested -= net;
            }
        });
        
        const avgPrice = buyUnits > 0 ? buyAmount / buyUnits : 0;
        const value = units * (fund.price || 0);
        const profit = value - invested;
        const returnPct = invested > 0 ? (profit / invested) * 100 : 0;
        
        return { units, avgPrice, value, invested, profit, returnPct };
    },
    
    updatePortfolio: function() {
        const m = this.calculateMetrics();
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        
        document.getElementById('total-units').textContent = m.units;
        document.getElementById('avg-price').textContent = Utils.formatCurrency(m.avgPrice);
        document.getElementById('current-price').textContent = Utils.formatCurrency(fund?.price || 0);
        document.getElementById('current-value').textContent = Utils.formatCurrency(m.value);
        document.getElementById('total-invested').textContent = Utils.formatCurrency(m.invested);
        document.getElementById('net-profit').textContent = Utils.formatCurrency(m.profit);
        document.getElementById('return-pct').textContent = Utils.formatCurrency(m.returnPct) + '%';
        
        // Color coding
        document.getElementById('net-profit').className = m.profit >= 0 ? 'positive' : 'negative';
        document.getElementById('return-pct').className = m.returnPct >= 0 ? 'positive' : 'negative';
        
        const valueBox = document.getElementById('value-box');
        valueBox.style.background = m.profit >= 0
            ? 'linear-gradient(135deg, var(--success) 0%, #059669 100%)'
            : 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)';
        
        this.updateRecommendation(m);
        this.renderPriceHistory();
        this.updateLastUpdate();
    },
    
    updateLastUpdate: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        if (!fund?.priceHistory?.length) {
            document.getElementById('last-update').textContent = '--';
            return;
        }
        const latest = fund.priceHistory[fund.priceHistory.length - 1];
        document.getElementById('last-update').textContent = Utils.formatDate(latest.date, this.lang);
    },
    
    updateRecommendation: function(m) {
        const rec = document.getElementById('recommendation');
        let type = 'neutral', text = '';
        
        if (m.invested === 0) {
            text = Utils.translate('ابدأ الاستثمار', 'Start Investing', this.lang);
            type = 'neutral';
        } else if (m.returnPct > 15) {
            text = Utils.translate('بع جزء من الأرباح', 'Sell Profits', this.lang);
            type = 'danger';
        } else if (m.returnPct > 8) {
            text = Utils.translate('احتفظ واستمر', 'Hold & Continue', this.lang);
            type = 'warning';
        } else if (m.returnPct < -5) {
            text = Utils.translate('اشترِ أكثر', 'Buy More', this.lang);
            type = 'success';
        } else {
            text = Utils.translate('مستقر', 'Stable', this.lang);
            type = 'neutral';
        }
        
        rec.className = 'badge ' + type;
        rec.innerHTML = `<i class="fas ${type === 'danger' ? 'fa-arrow-up' : type === 'success' ? 'fa-arrow-down' : 'fa-minus'}"></i> ${text}`;
    },
    
    renderPriceHistory: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        const tbody = document.getElementById('price-history-table');
        tbody.innerHTML = '';
        
        if (!fund?.priceHistory) return;
        
        const sorted = [...fund.priceHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sorted.forEach((entry, idx) => {
            const prev = idx < sorted.length - 1 ? sorted[idx + 1].price : entry.price;
            const change = ((entry.price - prev) / prev) * 100;
            const status = change > 2 ? '📈' : change < -2 ? '📉' : '➡️';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Utils.formatDate(entry.date, this.lang)}</td>
                <td>${Utils.formatCurrency(entry.price)}</td>
                <td class="${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${Utils.formatCurrency(change)}%</td>
                <td>${status}</td>
            `;
            tbody.appendChild(tr);
        });
    },
    
    // Price Management
    updatePrice: function() {
        const fund = Utils.getCurrentFund(this.funds, this.currentFundId);
        if (!fund) {
            alert(Utils.translate('اختر صندوق أولاً', 'Select fund first', this.lang));
            return;
        }
        
        const date = document.getElementById('price-date').value;
        const newPrice = parseFloat(document.getElementById('price-new').value);
        
        if (!date || !newPrice || newPrice <= 0) {
            alert(Utils.translate('الرجاء إدخال التاريخ والسعر', 'Please enter date and price', this.lang));
            return;
        }
        
        fund.price = newPrice;
        
        // Add to price history
        if (!fund.priceHistory) fund.priceHistory = [];
        const existingEntry = fund.priceHistory.find(p => p.date === date);
        if (existingEntry) {
            existingEntry.price = newPrice;
        } else {
            fund.priceHistory.push({ date, price: newPrice });
        }
        
        this.saveData();
        this.updatePortfolio();
        document.getElementById('price-new').value = '';
        alert(Utils.translate('تم تحديث السعر بنجاح', 'Price updated successfully', this.lang));
    },
    
    // Export Functions
    exportJSON: function() {
        Export.exportJSON(this.funds);
    },
    
    exportCSV: function() {
        Export.exportCSV(this.funds);
    },
    
    exportExcel: function() {
        Export.exportExcel(this.funds);
    },
    
    exportPDF: function() {
        Export.exportPDF(this.funds, this.lang);
    },
    
    // Import Functions
    importFile: async function() {
        const file = document.getElementById('import-file').files[0];
        if (!file) {
            alert(Utils.translate('اختر ملف أولاً', 'Choose file first', this.lang));
            return;
        }
        
        try {
            const importedFunds = await Export.importFile(file);
            if (importedFunds && importedFunds.length > 0) {
                this.funds = importedFunds;
                this.currentFundId = this.funds[0]?.id;
                this.saveData();
                this.renderAll();
                alert(Utils.translate('تم الاستيراد بنجاح', 'Imported successfully', this.lang));
                document.getElementById('import-file').value = '';
            }
        } catch (err) {
            alert(Utils.translate('خطأ: ' + err, 'Error: ' + err, this.lang));
        }
    },
    
    clearAllData: function() {
        if (!confirm(Utils.translate('حذف جميع البيانات؟', 'Delete all data?', this.lang))) return;
        this.funds = [];
        this.currentFundId = null;
        this.saveData();
        this.renderAll();
    },
    
    // Render All
    renderAll: function() {
        this.renderFundSelector();
        this.updatePortfolio();
        this.renderTransactionsTable();
        this.renderFundsTable();
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => app.init());
