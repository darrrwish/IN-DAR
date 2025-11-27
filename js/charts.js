// Charts Module - إدارة الرسوم البيانية
const Charts = {
    instances: {},
    
    // Initialize Charts.js
    init: function() {
        // Set Chart.js defaults with modern colors
        Chart.defaults.font.family = "'Cairo', sans-serif";
        Chart.defaults.color = document.body.getAttribute('data-theme') === 'dark' ? '#e0e0e0' : '#666';
    },
    
    // Destroy existing charts
    destroyChart: function(chartId) {
        if (Charts.instances[chartId]) {
            Charts.instances[chartId].destroy();
            delete Charts.instances[chartId];
        }
    },
    
    // Get theme colors
    getColors: function() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        return {
            primary: '#689B8A',
            secondary: '#F9CB99',
            accent: '#280A3E',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            text: isDark ? '#e0e0e0' : '#333',
            bg: isDark ? '#1f0a2e' : '#ffffff',
            border: isDark ? '#444' : '#ddd'
        };
    },
    
    // Price Evolution Chart
    createPriceChart: function(fund) {
        if (!fund || !fund.priceHistory || fund.priceHistory.length === 0) {
            console.warn('No price history data');
            return;
        }
        
        this.destroyChart('priceChart');
        
        const colors = this.getColors();
        const sorted = [...fund.priceHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;
        
        Charts.instances['priceChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sorted.map(p => new Date(p.date).toLocaleDateString('ar-EG')),
                datasets: [{
                    label: fund.name,
                    data: sorted.map(p => p.price),
                    borderColor: colors.primary,
                    backgroundColor: 'rgba(104, 155, 138, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: colors.secondary,
                    pointBorderColor: colors.primary,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: colors.text,
                            padding: 15,
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.accent,
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: colors.border },
                        ticks: { color: colors.text }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    }
                }
            }
        });
    },
    
    // Portfolio Distribution Chart
    createPortfolioChart: function(funds, currentFundId) {
        this.destroyChart('portfolioChart');
        
        const colors = this.getColors();
        const colorPalette = [colors.primary, colors.secondary, colors.warning, colors.info, colors.danger];
        
        const data = funds.map(f => {
            const tx = app.calculateMetricsForFund(f);
            return tx.value;
        });
        
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;
        
        Charts.instances['portfolioChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: funds.map(f => f.code),
                datasets: [{
                    data: data,
                    backgroundColor: colorPalette.slice(0, funds.length),
                    borderColor: colors.bg,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.text,
                            padding: 15,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.accent,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(2);
                                return `${context.label}: ${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Monthly Performance Chart
    createMonthlyChart: function(funds) {
        this.destroyChart('monthlyChart');
        
        const colors = this.getColors();
        
        // Group transactions by month
        const monthlyData = {};
        
        funds.forEach(fund => {
            fund.transactions.forEach(tx => {
                const date = new Date(tx.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
                
                const amount = tx.units * tx.price;
                const fee = tx.type === 'buy' 
                    ? amount * (fund.subscriptionFee / 100) 
                    : amount * (fund.redemptionFee / 100);
                
                monthlyData[monthKey] += tx.type === 'buy' ? (amount - fee) : (amount - fee);
            });
        });
        
        const sortedMonths = Object.keys(monthlyData).sort();
        
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        
        Charts.instances['monthlyChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths.map(m => {
                    const [year, month] = m.split('-');
                    return new Date(year, month - 1).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
                }),
                datasets: [{
                    label: 'المعاملات الشهرية',
                    data: sortedMonths.map(m => monthlyData[m]),
                    backgroundColor: colors.primary,
                    borderColor: colors.accent,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                plugins: {
                    legend: {
                        labels: {
                            color: colors.text,
                            font: { size: 13 }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: colors.border },
                        ticks: { color: colors.text }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    }
                }
            }
        });
    },
    
    // Return on Investment Chart
    createReturnChart: function(funds) {
        this.destroyChart('returnChart');
        
        const colors = this.getColors();
        
        const fundReturns = funds.map(fund => {
            const metrics = app.calculateMetricsForFund(fund);
            return metrics.returnPct;
        });
        
        const ctx = document.getElementById('returnChart');
        if (!ctx) return;
        
        Charts.instances['returnChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: funds.map(f => f.code),
                datasets: [{
                    label: 'نسبة العائد %',
                    data: fundReturns,
                    backgroundColor: fundReturns.map(r => r >= 0 ? colors.success : colors.danger),
                    borderColor: colors.text,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                plugins: {
                    legend: {
                        labels: {
                            color: colors.text,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.accent,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: colors.border },
                        ticks: { 
                            color: colors.text,
                            callback: function(value) {
                                return value.toFixed(0) + '%';
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    }
                }
            }
        });
    },
    
    // Update all charts
    updateAllCharts: function() {
        const fund = app.getCurrentFund();
        
        if (fund) {
            this.createPriceChart(fund);
        }
        this.createPortfolioChart(app.funds, app.currentFundId);
        this.createMonthlyChart(app.funds);
        this.createReturnChart(app.funds);
        
        this.updateStatistics();
    },
    
    // Update statistics
    updateStatistics: function() {
        const funds = app.funds;
        const totalTx = funds.reduce((sum, f) => sum + f.transactions.length, 0);
        
        let best = { code: '--', value: -999 };
        let worst = { code: '--', value: 999 };
        
        funds.forEach(f => {
            const metrics = app.calculateMetricsForFund(f);
            if (metrics.returnPct > best.value) {
                best = { code: f.code, value: metrics.returnPct };
            }
            if (metrics.returnPct < worst.value) {
                worst = { code: f.code, value: metrics.returnPct };
            }
        });
        
        document.getElementById('stats-funds-count').textContent = funds.length;
        document.getElementById('stats-tx-count').textContent = totalTx;
        document.getElementById('stats-best-fund').textContent = 
            best.value === -999 ? '--' : `${best.code} (${best.value.toFixed(2)}%)`;
        document.getElementById('stats-worst-fund').textContent = 
            worst.value === 999 ? '--' : `${worst.code} (${worst.value.toFixed(2)}%)`;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Charts.init();
});
