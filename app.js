class BOSDetector {
    constructor() {
        this.stocks = [];
        this.currentFilter = 'all';
        this.currentPattern = 'bos';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('scanBtn').addEventListener('click', () => this.scanStocks());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterStocks(e.target.dataset.filter);
            });
        });

        // Pattern selector
        document.querySelectorAll('input[name="pattern"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentPattern = e.target.value;
                this.togglePatternInfo(e.target.value);
                this.updateScanButtonText();
            });
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToExcel());
    }

    togglePatternInfo(pattern) {
        const bosInfo = document.getElementById('bosInfo');
        const chochInfo = document.getElementById('chochInfo');
        
        if (pattern === 'bos') {
            bosInfo.classList.remove('hidden');
            chochInfo.classList.add('hidden');
        } else {
            bosInfo.classList.add('hidden');
            chochInfo.classList.remove('hidden');
        }
    }

    updateScanButtonText() {
        const patternName = this.currentPattern === 'bos' ? 'BOS' : 'CHOCH';
        document.getElementById('scanBtnText').textContent = `🔍 Scan for ${patternName}`;
    }

    async scanStocks() {
        const scanBtn = document.getElementById('scanBtn');
        const scanBtnText = document.getElementById('scanBtnText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const scanInfo = document.getElementById('scanInfo');
        const scanProgress = document.getElementById('scanProgress');
        
        const timeframe = document.getElementById('timeframe').value;
        const patternName = this.currentPattern === 'bos' ? 'BOS' : 'CHOCH';
        const timeframeName = { '1d': 'Daily', '1wk': 'Weekly', '1mo': 'Monthly' }[timeframe] || 'Daily';
        
        scanBtn.disabled = true;
        scanBtnText.textContent = 'Scanning...';
        loadingSpinner.classList.remove('hidden');
        scanInfo.classList.remove('hidden');
        scanProgress.textContent = `Fetching ${timeframeName} data and analyzing ${patternName} patterns...`;
        
        this.hideAllStates();
        
        try {
            // Use current hostname and port for network compatibility
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const url = `${baseUrl}/api/stocks?pattern=${this.currentPattern}&timeframe=${timeframe}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.stocks = data.stocks;
                this.updateCounts();
                this.displayResults(data);
                
                if (this.stocks.length > 0) {
                    this.showNotification(`Found ${this.stocks.length} stocks with ${patternName}!`, 'success');
                } else {
                    document.getElementById('noResults').classList.remove('hidden');
                }
            } else {
                throw new Error(data.error || 'Failed to scan stocks');
            }
        } catch (error) {
            console.error('Scan error:', error);
            this.showNotification('Failed to scan stocks. Make sure the server is running.', 'error');
            document.getElementById('emptyState').classList.remove('hidden');
        } finally {
            scanBtn.disabled = false;
            scanBtnText.textContent = `🔍 Scan for ${patternName} Stocks`;
            loadingSpinner.classList.add('hidden');
            scanInfo.classList.add('hidden');
        }
    }

    updateCounts() {
        const bullishCount = this.stocks.filter(s => s.type === 'Bullish').length;
        const bearishCount = this.stocks.filter(s => s.type === 'Bearish').length;
        
        document.getElementById('countAll').textContent = this.stocks.length;
        document.getElementById('countBullish').textContent = bullishCount;
        document.getElementById('countBearish').textContent = bearishCount;
    }

    displayResults(data) {
        document.getElementById('results').classList.remove('hidden');
        
        const timeframeName = { '1d': 'Daily', '1wk': 'Weekly', '1mo': 'Monthly' }[data.timeframe] || 'Daily';
        
        document.getElementById('bosCount').textContent = `${data.count} stock${data.count !== 1 ? 's' : ''} (${data.pattern} - ${timeframeName})`;
        document.getElementById('scanTime').textContent = `Scanned ${data.scannedCount} stocks`;
        
        this.renderStocks();
    }

    filterStocks(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderStocks();
    }

    renderStocks() {
        const container = document.getElementById('stocksList');
        
        let filteredStocks = this.stocks;
        if (this.currentFilter === 'bullish') {
            filteredStocks = this.stocks.filter(s => s.type === 'Bullish');
        } else if (this.currentFilter === 'bearish') {
            filteredStocks = this.stocks.filter(s => s.type === 'Bearish');
        }
        
        if (filteredStocks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No stocks match this filter.</div>';
            return;
        }
        
        container.innerHTML = filteredStocks.map(stock => this.createStockCard(stock)).join('');
    }

    createStockCard(stock) {
        const patternType = stock.type.toLowerCase();
        const changeSymbol = stock.change >= 0 ? '+' : '';
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const patternName = stock.pattern || 'BOS';
        
        return `
            <div class="stock-card ${patternType}">
                <div class="stock-header">
                    <div>
                        <div class="stock-symbol">${stock.symbol}</div>
                    </div>
                    <div class="bos-badge ${patternType}">${stock.type} ${patternName}</div>
                </div>
                <div class="stock-name">${stock.name}</div>
                <div class="stock-details">
                    ${stock.previousTrend ? `
                    <div class="detail-row">
                        <span class="detail-label">Previous Trend</span>
                        <span class="detail-value" style="font-weight: 600; color: ${stock.previousTrend === 'Uptrend' ? '#10b981' : '#ef4444'};">${stock.previousTrend}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">${patternName} Break Date</span>
                        <span class="detail-value" style="font-weight: 700;">${this.formatDate(stock.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Break Price (Close on Break Date)</span>
                        <span class="detail-value" style="font-weight: 700;">₹${stock.breakPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Change on Break Day</span>
                        <span class="detail-value price-change ${changeClass}">
                            ${changeSymbol}₹${stock.change.toFixed(2)} (${changeSymbol}${stock.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Current Price (Latest)</span>
                        <span class="detail-value">₹${stock.close.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">${patternName} Level (Structure)</span>
                        <span class="detail-value">₹${stock.structurePrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Structure Date</span>
                        <span class="detail-value">${this.formatDate(stock.structureDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    hideAllStates() {
        document.getElementById('results').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('noResults').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }

    exportToExcel() {
        if (this.stocks.length === 0) {
            this.showNotification('No data to export. Please scan for stocks first.', 'error');
            return;
        }

        // Get filtered stocks based on current filter
        let filteredStocks = this.stocks;
        if (this.currentFilter === 'bullish') {
            filteredStocks = this.stocks.filter(s => s.type === 'Bullish');
        } else if (this.currentFilter === 'bearish') {
            filteredStocks = this.stocks.filter(s => s.type === 'Bearish');
        }

        if (filteredStocks.length === 0) {
            this.showNotification('No stocks match the current filter.', 'error');
            return;
        }

        // Prepare data for Excel
        const excelData = filteredStocks.map(stock => {
            const row = {
                'Symbol': stock.symbol,
                'Company Name': stock.name,
                'Pattern': stock.pattern || 'BOS',
                'Type': stock.type,
                'Break Date': stock.date,
                'Break Price (₹)': parseFloat(stock.breakPrice.toFixed(2)),
                'Current Price (₹)': parseFloat(stock.close.toFixed(2)),
                'Change on Break Day (₹)': parseFloat(stock.change.toFixed(2)),
                'Change %': parseFloat(stock.changePercent.toFixed(2)),
                'Structure Price (₹)': parseFloat(stock.structurePrice.toFixed(2)),
                'Structure Date': stock.structureDate
            };

            // Add Previous Trend for CHOCH
            if (stock.previousTrend) {
                row['Previous Trend'] = stock.previousTrend;
            }

            return row;
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const colWidths = [
            { wch: 18 },  // Symbol
            { wch: 35 },  // Company Name
            { wch: 10 },  // Pattern
            { wch: 10 },  // Type
            { wch: 12 },  // Break Date
            { wch: 15 },  // Break Price
            { wch: 15 },  // Current Price
            { wch: 18 },  // Change on Break Day
            { wch: 10 },  // Change %
            { wch: 18 },  // Structure Price
            { wch: 14 },  // Structure Date
            { wch: 15 }   // Previous Trend
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Pattern Analysis');

        // Generate filename with timestamp
        const timeframe = document.getElementById('timeframe').value;
        const timeframeName = { '1d': 'Daily', '1wk': 'Weekly', '1mo': 'Monthly' }[timeframe] || 'Daily';
        const patternName = filteredStocks[0]?.pattern || 'BOS';
        const filterName = this.currentFilter === 'all' ? 'All' : this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${patternName}_${timeframeName}_${filterName}_${timestamp}.xlsx`;

        // Download the file
        XLSX.writeFile(wb, filename);

        this.showNotification(`Exported ${filteredStocks.length} stocks to ${filename}`, 'success');
    }
}

const detector = new BOSDetector();
