// Export Module - تصدير البيانات بصيغ مختلفة
const Export = {
    // تصدير JSON
    exportJSON: (funds) => {
        const data = { 
            funds, 
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        Utils.downloadFile(
            JSON.stringify(data, null, 2),
            `investment-backup-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    },
    
    // تصدير CSV
    exportCSV: (funds) => {
        let csv = 'الصندوق,الكود,التاريخ,النوع,الوثائق,السعر,المبلغ,الرسوم\n';
        funds.forEach(f => {
            f.transactions.forEach(tx => {
                const amount = tx.units * tx.price;
                const fee = tx.type === 'buy' 
                    ? amount * (f.subscriptionFee / 100) 
                    : amount * (f.redemptionFee / 100);
                csv += `"${f.name}","${f.code}","${tx.date}","${tx.type === 'buy' ? 'شراء' : 'بيع'}",${tx.units},${tx.price},${amount},${fee}\n`;
            });
        });
        Utils.downloadFile(
            csv,
            `investment-backup-${new Date().toISOString().split('T')[0]}.csv`,
            'text/csv'
        );
    },
    
    // تصدير Excel
    exportExcel: (funds) => {
        const data = [];
        funds.forEach(f => {
            f.transactions.forEach(tx => {
                const amount = tx.units * tx.price;
                const fee = tx.type === 'buy' 
                    ? amount * (f.subscriptionFee / 100) 
                    : amount * (f.redemptionFee / 100);
                data.push({
                    'الصندوق': f.name,
                    'الكود': f.code,
                    'التاريخ': tx.date,
                    'النوع': tx.type === 'buy' ? 'شراء' : 'بيع',
                    'الوثائق': tx.units,
                    'السعر': tx.price,
                    'المبلغ': amount,
                    'الرسوم': fee,
                    'السعر الحالي': f.price
                });
            });
        });
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الاستثمارات');
        XLSX.writeFile(wb, `investment-backup-${new Date().toISOString().split('T')[0]}.xlsx`);
    },
    
    // تصدير PDF بتصميم احترافي
    exportPDF: (funds, lang) => {
        const element = document.querySelector('.container');
        const opt = {
            margin: 10,
            filename: `investment-report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#F2EDD1' },
            jsPDF: { 
                orientation: 'p', 
                unit: 'mm', 
                format: 'a4'
            }
        };
        html2pdf().set(opt).from(element).save();
    },
    
    // استيراد ملف
    importFile: async (file) => {
        const fileType = file.name.split('.').pop().toLowerCase();
        
        if (fileType === 'json') {
            return Export.importJSON(file);
        } else if (fileType === 'csv') {
            return Export.importCSV(file);
        } else if (fileType === 'xlsx') {
            return Export.importExcel(file);
        }
        return null;
    },
    
    // استيراد JSON
    importJSON: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data.funds || []);
                } catch (err) {
                    reject('خطأ في ملف JSON');
                }
            };
            reader.onerror = () => reject('خطأ في قراءة الملف');
            reader.readAsText(file);
        });
    },
    
    // استيراد CSV
    importCSV: (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                complete: (results) => {
                    try {
                        const funds = [];
                        const grouped = {};
                        
                        results.data.slice(1).forEach(row => {
                            if (row.length < 3) return;
                            
                            const fundName = row[0];
                            const fundCode = row[1];
                            const key = fundName + fundCode;
                            
                            if (!grouped[key]) {
                                grouped[key] = {
                                    id: Date.now().toString() + Math.random(),
                                    name: fundName,
                                    code: fundCode,
                                    price: parseFloat(row[9]) || 0,
                                    subscriptionFee: 0,
                                    redemptionFee: 0,
                                    transactions: [],
                                    priceHistory: []
                                };
                            }
                            
                            if (row[2] && row[3]) {
                                grouped[key].transactions.push({
                                    date: row[2],
                                    type: row[3].includes('شراء') ? 'buy' : 'sell',
                                    units: parseInt(row[4]) || 0,
                                    price: parseFloat(row[5]) || 0
                                });
                            }
                        });
                        
                        resolve(Object.values(grouped));
                    } catch (err) {
                        reject('خطأ في معالجة CSV');
                    }
                },
                error: (error) => reject('خطأ في قراءة CSV: ' + error.message)
            });
        });
    },
    
    // استيراد Excel
    importExcel: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(worksheet);
                    
                    const funds = [];
                    const grouped = {};
                    
                    data.forEach(row => {
                        const fundName = row['الصندوق'] || row['Fund'] || '';
                        const fundCode = row['الكود'] || row['Code'] || '';
                        const key = fundName + fundCode;
                        
                        if (!grouped[key]) {
                            grouped[key] = {
                                id: Date.now().toString() + Math.random(),
                                name: fundName,
                                code: fundCode,
                                price: parseFloat(row['السعر الحالي'] || row['Current Price']) || 0,
                                subscriptionFee: 0,
                                redemptionFee: 0,
                                transactions: [],
                                priceHistory: []
                            };
                        }
                        
                        grouped[key].transactions.push({
                            date: row['التاريخ'] || row['Date'] || new Date().toISOString().split('T')[0],
                            type: (row['النوع'] || row['Type'] || '').includes('شراء') ? 'buy' : 'sell',
                            units: parseInt(row['الوثائق'] || row['Units']) || 0,
                            price: parseFloat(row['السعر'] || row['Price']) || 0
                        });
                    });
                    
                    resolve(Object.values(grouped));
                } catch (err) {
                    reject('خطأ في معالجة Excel: ' + err.message);
                }
            };
            reader.onerror = () => reject('خطأ في قراءة الملف');
            reader.readAsBinaryString(file);
        });
    }
};
