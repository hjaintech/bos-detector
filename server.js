import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Nifty 50 Index stocks (all 50 stocks)
const INDIAN_STOCKS = [
    // Top weighted stocks
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    
    // Major blue chips
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
    'TITAN.NS', 'BAJFINANCE.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'WIPRO.NS',
    
    // Energy & Infrastructure
    'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS', 'ADANIPORTS.NS', 'COALINDIA.NS',
    'ADANIENT.NS', 'BPCL.NS', 'IOC.NS',
    
    // Auto & Manufacturing
    'M&M.NS', 'TATAMOTORS.NS', 'BAJAJ-AUTO.NS', 'HEROMOTOCO.NS', 'EICHERMOT.NS',
    
    // Metals & Materials
    'TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS',
    
    // IT & Tech
    'TECHM.NS', 'HCLTECH.NS', 'LTIM.NS',
    
    // Pharma
    'DIVISLAB.NS', 'DRREDDY.NS', 'CIPLA.NS', 'APOLLOHOSP.NS',
    
    // FMCG & Consumer
    'BRITANNIA.NS', 'TATACONSUM.NS',
    
    // Financial Services
    'BAJAJFINSV.NS', 'SBILIFE.NS', 'HDFCLIFE.NS',
    
    // Telecom & Services
    'INDUSINDBK.NS', 'GRASIM.NS'
];

// Fetch historical data for a stock
async function fetchHistoricalData(symbol, days = 60, interval = '1d') {
    try {
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (days * 24 * 60 * 60);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.chart?.result?.[0]) {
            return null;
        }
        
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const meta = result.meta;
        
        const bars = timestamps.map((timestamp, index) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            open: quote.open[index],
            high: quote.high[index],
            low: quote.low[index],
            close: quote.close[index],
            volume: quote.volume[index]
        })).filter(bar => bar.open && bar.high && bar.low && bar.close);
        
        return {
            symbol: meta.symbol,
            name: meta.longName || meta.symbol,
            currency: meta.currency,
            bars: bars
        };
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        return null;
    }
}

// Identify swing highs and lows
function findSwingPoints(bars, lookback = 5) {
    const swingHighs = [];
    const swingLows = [];
    
    for (let i = lookback; i < bars.length - lookback; i++) {
        const currentHigh = bars[i].high;
        const currentLow = bars[i].low;
        
        // Check if it's a swing high
        let isSwingHigh = true;
        for (let j = 1; j <= lookback; j++) {
            if (bars[i - j].high >= currentHigh || bars[i + j].high >= currentHigh) {
                isSwingHigh = false;
                break;
            }
        }
        if (isSwingHigh) {
            swingHighs.push({ index: i, price: currentHigh, date: bars[i].date });
        }
        
        // Check if it's a swing low
        let isSwingLow = true;
        for (let j = 1; j <= lookback; j++) {
            if (bars[i - j].low <= currentLow || bars[i + j].low <= currentLow) {
                isSwingLow = false;
                break;
            }
        }
        if (isSwingLow) {
            swingLows.push({ index: i, price: currentLow, date: bars[i].date });
        }
    }
    
    return { swingHighs, swingLows };
}

// Detect BOS at a specific bar index
function detectBOSAtIndex(bars, barIndex, swingHighs, swingLows) {
    if (barIndex < 1 || barIndex >= bars.length) {
        return null;
    }
    
    const prevBar = bars[barIndex - 1];
    const currentBar = bars[barIndex];
    
    // Check for bullish BOS (must CROSS above AND CLOSE above)
    const relevantSwingHighs = swingHighs.filter(sh => sh.index < barIndex);
    if (relevantSwingHighs.length > 0) {
        const lastSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        // Require: high crossed above structure AND close is above structure
        if (currentBar.high > lastSwingHigh.price && currentBar.close > lastSwingHigh.price) {
            const previousSwingHighs = relevantSwingHighs.slice(0, -1);
            if (previousSwingHighs.length > 0) {
                return {
                    type: 'Bullish',
                    date: currentBar.date,
                    breakPrice: currentBar.close,
                    structurePrice: lastSwingHigh.price,
                    structureDate: lastSwingHigh.date,
                    close: currentBar.close,
                    change: currentBar.close - prevBar.close,
                    changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100
                };
            }
        }
    }
    
    // Check for bearish BOS (must CROSS below AND CLOSE below)
    const relevantSwingLows = swingLows.filter(sl => sl.index < barIndex);
    if (relevantSwingLows.length > 0) {
        const lastSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        // Require: low crossed below structure AND close is below structure
        if (currentBar.low < lastSwingLow.price && currentBar.close < lastSwingLow.price) {
            const previousSwingLows = relevantSwingLows.slice(0, -1);
            if (previousSwingLows.length > 0) {
                return {
                    type: 'Bearish',
                    date: currentBar.date,
                    breakPrice: currentBar.close,
                    structurePrice: lastSwingLow.price,
                    structureDate: lastSwingLow.date,
                    close: currentBar.close,
                    change: currentBar.close - prevBar.close,
                    changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100
                };
            }
        }
    }
    
    return null;
}

// Detect BOS (Break of Structure) - detects latest bar's close
function detectBOS(bars) {
    if (bars.length < 20) {
        return { hasBOS: false };
    }
    
    const { swingHighs, swingLows } = findSwingPoints(bars);
    
    if (swingHighs.length < 2 || swingLows.length < 2) {
        return { hasBOS: false };
    }
    
    const todayIndex = bars.length - 1;
    const result = detectBOSAtIndex(bars, todayIndex, swingHighs, swingLows);
    
    if (result) {
        return { hasBOS: true, ...result };
    }
    
    return { hasBOS: false };
}

// Detect CHOCH at a specific bar index
function detectCHOCHAtIndex(bars, barIndex, swingHighs, swingLows) {
    if (barIndex < 1 || barIndex >= bars.length) {
        return null;
    }
    
    const prevBar = bars[barIndex - 1];
    const currentBar = bars[barIndex];
    
    // Determine trend by comparing recent swing highs and lows
    const recentSwingHighs = swingHighs.filter(sh => sh.index < barIndex).slice(-3);
    const recentSwingLows = swingLows.filter(sl => sl.index < barIndex).slice(-3);
    
    if (recentSwingHighs.length < 2 || recentSwingLows.length < 2) {
        return null;
    }
    
    // Check for bullish CHOCH (breaking above recent swing high in downtrend)
    const isDowntrend = recentSwingHighs.length >= 2 && 
                        recentSwingHighs[recentSwingHighs.length - 1].price < recentSwingHighs[recentSwingHighs.length - 2].price &&
                        recentSwingLows.length >= 2 &&
                        recentSwingLows[recentSwingLows.length - 1].price < recentSwingLows[recentSwingLows.length - 2].price;
    
    if (isDowntrend) {
        const lastSwingHigh = recentSwingHighs[recentSwingHighs.length - 1];
        // Require: high crossed above structure AND close is above structure
        if (currentBar.high > lastSwingHigh.price && currentBar.close > lastSwingHigh.price) {
            return {
                type: 'Bullish',
                date: currentBar.date,
                breakPrice: currentBar.close,
                structurePrice: lastSwingHigh.price,
                structureDate: lastSwingHigh.date,
                close: currentBar.close,
                change: currentBar.close - prevBar.close,
                changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100,
                previousTrend: 'Downtrend'
            };
        }
    }
    
    // Check for bearish CHOCH (breaking below recent swing low in uptrend)
    const isUptrend = recentSwingHighs.length >= 2 &&
                      recentSwingHighs[recentSwingHighs.length - 1].price > recentSwingHighs[recentSwingHighs.length - 2].price &&
                      recentSwingLows.length >= 2 &&
                      recentSwingLows[recentSwingLows.length - 1].price > recentSwingLows[recentSwingLows.length - 2].price;
    
    if (isUptrend) {
        const lastSwingLow = recentSwingLows[recentSwingLows.length - 1];
        // Require: low crossed below structure AND close is below structure
        if (currentBar.low < lastSwingLow.price && currentBar.close < lastSwingLow.price) {
            return {
                type: 'Bearish',
                date: currentBar.date,
                breakPrice: currentBar.close,
                structurePrice: lastSwingLow.price,
                structureDate: lastSwingLow.date,
                close: currentBar.close,
                change: currentBar.close - prevBar.close,
                changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100,
                previousTrend: 'Uptrend'
            };
        }
    }
    
    return null;
}

// Detect CHOCH (Change of Character) - detects latest bar's close
function detectCHOCH(bars) {
    if (bars.length < 20) {
        return { hasCHOCH: false };
    }
    
    const { swingHighs, swingLows } = findSwingPoints(bars);
    
    if (swingHighs.length < 3 || swingLows.length < 3) {
        return { hasCHOCH: false };
    }
    
    const todayIndex = bars.length - 1;
    const result = detectCHOCHAtIndex(bars, todayIndex, swingHighs, swingLows);
    
    if (result) {
        return { hasCHOCH: true, ...result };
    }
    
    return { hasCHOCH: false };
}

// API endpoint to get stocks with BOS or CHOCH
app.get('/api/stocks', async (req, res) => {
    try {
        const pattern = req.query.pattern || 'bos';
        const timeframe = req.query.timeframe || '1d'; // 1d, 1wk, 1mo
        
        // Map timeframe to days for historical data fetch
        const timeframeDays = {
            '1d': 60,
            '1wk': 180,
            '1mo': 365
        };
        const days = timeframeDays[timeframe] || 60;
        
        console.log(`Fetching ${pattern.toUpperCase()} stocks (${timeframe} timeframe)...`);
        const detectedStocks = [];
        
        let processed = 0;
        for (const symbol of INDIAN_STOCKS) {
            processed++;
            console.log(`Processing ${processed}/${INDIAN_STOCKS.length}: ${symbol}`);
            
            const data = await fetchHistoricalData(symbol, days, timeframe);
            if (!data || data.bars.length < 20) {
                continue;
            }
            
            const { swingHighs, swingLows } = findSwingPoints(data.bars);
            
            if ((pattern === 'bos' && (swingHighs.length < 2 || swingLows.length < 2)) ||
                (pattern === 'choch' && (swingHighs.length < 3 || swingLows.length < 3))) {
                continue;
            }
            
            // Check only the latest bar
            if (pattern === 'choch') {
                const chochResult = detectCHOCH(data.bars);
                if (chochResult.hasCHOCH) {
                    detectedStocks.push({
                        symbol: data.symbol,
                        name: data.name,
                        pattern: 'CHOCH',
                        ...chochResult
                    });
                    console.log(`✓ Found CHOCH: ${symbol} - ${chochResult.type} (was ${chochResult.previousTrend})`);
                }
            } else {
                const bosResult = detectBOS(data.bars);
                if (bosResult.hasBOS) {
                    detectedStocks.push({
                        symbol: data.symbol,
                        name: data.name,
                        pattern: 'BOS',
                        ...bosResult
                    });
                    console.log(`✓ Found BOS: ${symbol} - ${bosResult.type}`);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Found ${detectedStocks.length} stocks with ${pattern.toUpperCase()}`);
        
        res.json({
            success: true,
            pattern: pattern.toUpperCase(),
            timeframe: timeframe,
            count: detectedStocks.length,
            stocks: detectedStocks,
            scannedCount: INDIAN_STOCKS.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error in ${req.query.pattern || 'BOS'} detection:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Legacy endpoint for backward compatibility
app.get('/api/bos-stocks', async (req, res) => {
    try {
        const pattern = 'bos';
        console.log(`Fetching ${pattern.toUpperCase()} stocks...`);
        const detectedStocks = [];
        
        let processed = 0;
        for (const symbol of INDIAN_STOCKS) {
            processed++;
            console.log(`Processing ${processed}/${INDIAN_STOCKS.length}: ${symbol}`);
            
            const data = await fetchHistoricalData(symbol);
            if (!data || data.bars.length < 20) {
                continue;
            }
            
            const bosResult = detectBOS(data.bars);
            if (bosResult.hasBOS) {
                detectedStocks.push({
                    symbol: data.symbol,
                    name: data.name,
                    pattern: 'BOS',
                    ...bosResult
                });
                console.log(`✓ Found BOS: ${symbol} - ${bosResult.type}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Found ${detectedStocks.length} stocks with BOS`);
        
        res.json({
            success: true,
            pattern: 'BOS',
            count: detectedStocks.length,
            stocks: detectedStocks,
            scannedCount: INDIAN_STOCKS.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in BOS detection:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get historical data for a specific stock
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const data = await fetchHistoricalData(symbol);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found or data unavailable'
            });
        }
        
        const bosResult = detectBOS(data.bars);
        
        res.json({
            success: true,
            ...data,
            bos: bosResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Stock BOS Detector server running on http://localhost:${PORT}`);
    console.log(`Monitoring ${INDIAN_STOCKS.length} Indian stocks`);
});
