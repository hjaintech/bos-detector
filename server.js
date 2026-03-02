import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Nifty 100 Index stocks (Nifty 50 + Nifty Next 50)
const INDIAN_STOCKS = [
    // ===== NIFTY 50 STOCKS =====
    
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
    'INDUSINDBK.NS', 'GRASIM.NS',
    
    // ===== NIFTY NEXT 50 STOCKS (Additional 50) =====
    
    // Financial Services & Banking
    'PNB.NS', 'BANKBARODA.NS', 'ICICIPRULI.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS',
    'BANDHANBNK.NS', 'SBICARD.NS', 'ICICIGI.NS',
    
    // FMCG & Consumer
    'MARICO.NS', 'DABUR.NS', 'GODREJCP.NS', 'PIDILITIND.NS', 'COLPAL.NS',
    'HAVELLS.NS', 'VOLTAS.NS', 'VBL.NS', 'DMART.NS',
    
    // Energy & Utilities
    'TATAPOWER.NS', 'TORNTPOWER.NS', 'ADANIGREEN.NS', 'SIEMENS.NS', 'GAIL.NS',
    'PETRONET.NS', 'OIL.NS', 'HINDPETRO.NS',
    
    // Auto & Manufacturing
    'BOSCHLTD.NS', 'TVSMOTOR.NS', 'ESCORTS.NS', 'MOTHERSON.NS',
    
    // Cement & Construction
    'AMBUJACEM.NS', 'ACC.NS', 'SHREECEM.NS',
    
    // IT & Technology
    'PERSISTENT.NS', 'COFORGE.NS', 'MPHASIS.NS',
    
    // Metals & Materials
    'JINDALSTEL.NS', 'SAIL.NS', 'NMDC.NS',
    
    // Pharma & Healthcare
    'BIOCON.NS', 'TORNTPHARM.NS', 'ALKEM.NS', 'LUPIN.NS', 'AUROPHARMA.NS',
    
    // Industrial & Conglomerates
    'ABB.NS', 'CUMMINSIND.NS', 'BERGEPAINT.NS',
    
    // Real Estate & Media
    'DLF.NS', 'GODREJPROP.NS', 'PAGEIND.NS', 'ZEEL.NS'
];

// Convert Yahoo Finance date to actual trading day (Monday for weekly, last weekday for monthly)
function convertToTradingDay(dateStr, interval) {
    const date = new Date(dateStr + 'T00:00:00Z');
    
    // For weekly candles, NSE/BSE week starts on Monday
    // Yahoo typically gives week-ending date (often Monday or Sunday)
    // We want to show Monday (week start date)
    if (interval === '1wk') {
        const dayOfWeek = date.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        // Convert to Monday (week start)
        if (dayOfWeek === 0) { // Sunday -> go back 6 days to Monday
            date.setUTCDate(date.getUTCDate() - 6);
        } else if (dayOfWeek === 2) { // Tuesday -> go back 1 day to Monday
            date.setUTCDate(date.getUTCDate() - 1);
        } else if (dayOfWeek === 3) { // Wednesday -> go back 2 days to Monday
            date.setUTCDate(date.getUTCDate() - 2);
        } else if (dayOfWeek === 4) { // Thursday -> go back 3 days to Monday
            date.setUTCDate(date.getUTCDate() - 3);
        } else if (dayOfWeek === 5) { // Friday -> go back 4 days to Monday
            date.setUTCDate(date.getUTCDate() - 4);
        } else if (dayOfWeek === 6) { // Saturday -> go back 5 days to Monday
            date.setUTCDate(date.getUTCDate() - 5);
        }
        // If already Monday (1), keep it
        
        // Ensure we don't go into the future
        const now = new Date();
        if (date > now) {
            // Move back to most recent Monday
            const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
            const todayDay = today.getUTCDay();
            // Days to go back to reach Monday
            const daysBackToMonday = todayDay === 0 ? 6 : todayDay - 1;
            date.setTime(today.getTime() - (daysBackToMonday * 24 * 60 * 60 * 1000));
        }
        
        return date.toISOString().split('T')[0];
    }
    
    // For monthly candles, use the last trading day of the month
    if (interval === '1mo') {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const lastDay = new Date(Date.UTC(year, month + 1, 0));
        
        // Adjust for weekends
        let dayOfWeek = lastDay.getUTCDay();
        while (dayOfWeek === 0 || dayOfWeek === 6) {
            lastDay.setUTCDate(lastDay.getUTCDate() - 1);
            dayOfWeek = lastDay.getUTCDay();
        }
        
        return lastDay.toISOString().split('T')[0];
    }
    
    // For daily, ensure it's a weekday
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0) { // Sunday -> previous Friday
        date.setUTCDate(date.getUTCDate() - 2);
    } else if (dayOfWeek === 6) { // Saturday -> previous Friday
        date.setUTCDate(date.getUTCDate() - 1);
    }
    
    return date.toISOString().split('T')[0];
}

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
        
        const bars = timestamps.map((timestamp, index) => {
            const rawDate = new Date(timestamp * 1000).toISOString().split('T')[0];
            const tradingDate = convertToTradingDay(rawDate, interval);
            
            return {
                date: tradingDate,
                rawDate: rawDate,
                open: quote.open[index],
                high: quote.high[index],
                low: quote.low[index],
                close: quote.close[index],
                volume: quote.volume[index]
            };
        }).filter(bar => bar.open && bar.high && bar.low && bar.close);
        
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
    
    // Adjust lookback for fewer bars available
    const effectiveLookback = Math.min(lookback, Math.floor((bars.length - 1) / 3));
    
    if (effectiveLookback < 2) {
        return { swingHighs, swingLows };
    }
    
    for (let i = effectiveLookback; i < bars.length - effectiveLookback; i++) {
        const currentHigh = bars[i].high;
        const currentLow = bars[i].low;
        
        // Check if it's a swing high
        let isSwingHigh = true;
        for (let j = 1; j <= effectiveLookback; j++) {
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
        for (let j = 1; j <= effectiveLookback; j++) {
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

// Find the BOS break date - the first bar where close crossed from one side to the other
function findBOSBreak(bars, structurePrice, type, structureIndex) {
    // Scan forward from structure point to find the first break
    for (let i = structureIndex + 1; i < bars.length; i++) {
        const prevBar = bars[i - 1];
        const currentBar = bars[i];
        
        if (type === 'bullish') {
            // Previous close was at or below, current close is above
            if (prevBar.close <= structurePrice && currentBar.close > structurePrice) {
                // Also verify it crossed (high went above)
                if (currentBar.high > structurePrice) {
                    return {
                        breakIndex: i,
                        breakDate: currentBar.date,
                        breakPrice: currentBar.close,
                        change: currentBar.close - prevBar.close,
                        changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100
                    };
                }
            }
        } else if (type === 'bearish') {
            // Previous close was at or above, current close is below
            if (prevBar.close >= structurePrice && currentBar.close < structurePrice) {
                // Also verify it crossed (low went below)
                if (currentBar.low < structurePrice) {
                    return {
                        breakIndex: i,
                        breakDate: currentBar.date,
                        breakPrice: currentBar.close,
                        change: currentBar.close - prevBar.close,
                        changePercent: ((currentBar.close - prevBar.close) / prevBar.close) * 100
                    };
                }
            }
        }
    }
    
    return null;
}

// Detect BOS at a specific bar index (checks if BOS exists and finds break details)
function detectBOSAtIndex(bars, barIndex, swingHighs, swingLows) {
    if (barIndex < 1 || barIndex >= bars.length) {
        return null;
    }
    
    const currentBar = bars[barIndex];
    
    // Check for bullish BOS - current bar must be above structure
    const relevantSwingHighs = swingHighs.filter(sh => sh.index < barIndex);
    if (relevantSwingHighs.length > 1) {
        const lastSwingHigh = relevantSwingHighs[relevantSwingHighs.length - 1];
        
        // Check if current bar is above structure
        if (currentBar.close > lastSwingHigh.price) {
            // Find the actual break date
            const breakInfo = findBOSBreak(bars, lastSwingHigh.price, 'bullish', lastSwingHigh.index);
            
            if (breakInfo && breakInfo.breakIndex <= barIndex) {
                return {
                    type: 'Bullish',
                    date: breakInfo.breakDate,
                    breakPrice: breakInfo.breakPrice,
                    structurePrice: lastSwingHigh.price,
                    structureDate: lastSwingHigh.date,
                    close: currentBar.close,
                    change: breakInfo.change,
                    changePercent: breakInfo.changePercent
                };
            }
        }
    }
    
    // Check for bearish BOS - current bar must be below structure
    const relevantSwingLows = swingLows.filter(sl => sl.index < barIndex);
    if (relevantSwingLows.length > 1) {
        const lastSwingLow = relevantSwingLows[relevantSwingLows.length - 1];
        
        // Check if current bar is below structure
        if (currentBar.close < lastSwingLow.price) {
            // Find the actual break date
            const breakInfo = findBOSBreak(bars, lastSwingLow.price, 'bearish', lastSwingLow.index);
            
            if (breakInfo && breakInfo.breakIndex <= barIndex) {
                return {
                    type: 'Bearish',
                    date: breakInfo.breakDate,
                    breakPrice: breakInfo.breakPrice,
                    structurePrice: lastSwingLow.price,
                    structureDate: lastSwingLow.date,
                    close: currentBar.close,
                    change: breakInfo.change,
                    changePercent: breakInfo.changePercent
                };
            }
        }
    }
    
    return null;
}

// Detect BOS (Break of Structure) - detects latest bar's close
function detectBOS(bars, lookback = 5) {
    if (bars.length < 10) {
        return { hasBOS: false };
    }
    
    const { swingHighs, swingLows } = findSwingPoints(bars, lookback);
    
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

// Detect CHOCH at a specific bar index (checks if CHOCH exists and finds break details)
function detectCHOCHAtIndex(bars, barIndex, swingHighs, swingLows) {
    if (barIndex < 1 || barIndex >= bars.length) {
        return null;
    }
    
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
        
        // Check if current bar is above structure
        if (currentBar.close > lastSwingHigh.price) {
            // Find the actual break date
            const breakInfo = findBOSBreak(bars, lastSwingHigh.price, 'bullish', lastSwingHigh.index);
            
            if (breakInfo && breakInfo.breakIndex <= barIndex) {
                return {
                    type: 'Bullish',
                    date: breakInfo.breakDate,
                    breakPrice: breakInfo.breakPrice,
                    structurePrice: lastSwingHigh.price,
                    structureDate: lastSwingHigh.date,
                    close: currentBar.close,
                    change: breakInfo.change,
                    changePercent: breakInfo.changePercent,
                    previousTrend: 'Downtrend'
                };
            }
        }
    }
    
    // Check for bearish CHOCH (breaking below recent swing low in uptrend)
    const isUptrend = recentSwingHighs.length >= 2 &&
                      recentSwingHighs[recentSwingHighs.length - 1].price > recentSwingHighs[recentSwingHighs.length - 2].price &&
                      recentSwingLows.length >= 2 &&
                      recentSwingLows[recentSwingLows.length - 1].price > recentSwingLows[recentSwingLows.length - 2].price;
    
    if (isUptrend) {
        const lastSwingLow = recentSwingLows[recentSwingLows.length - 1];
        
        // Check if current bar is below structure
        if (currentBar.close < lastSwingLow.price) {
            // Find the actual break date
            const breakInfo = findBOSBreak(bars, lastSwingLow.price, 'bearish', lastSwingLow.index);
            
            if (breakInfo && breakInfo.breakIndex <= barIndex) {
                return {
                    type: 'Bearish',
                    date: breakInfo.breakDate,
                    breakPrice: breakInfo.breakPrice,
                    structurePrice: lastSwingLow.price,
                    structureDate: lastSwingLow.date,
                    close: currentBar.close,
                    change: breakInfo.change,
                    changePercent: breakInfo.changePercent,
                    previousTrend: 'Uptrend'
                };
            }
        }
    }
    
    return null;
}

// Detect CHOCH (Change of Character) - detects latest bar's close
function detectCHOCH(bars, lookback = 5) {
    if (bars.length < 10) {
        return { hasCHOCH: false };
    }
    
    const { swingHighs, swingLows } = findSwingPoints(bars, lookback);
    
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
            if (!data || data.bars.length < 10) {
                if (!data) {
                    console.log(`  ⚠ No data for ${symbol}`);
                } else {
                    console.log(`  ⚠ Insufficient bars for ${symbol}: ${data.bars.length} bars`);
                }
                continue;
            }
            
            // Adjust lookback based on timeframe
            const lookbackMap = {
                '1d': 5,   // Daily: 5 bars
                '1wk': 3,  // Weekly: 3 bars (more sensitive)
                '1mo': 2   // Monthly: 2 bars (most sensitive)
            };
            const lookback = lookbackMap[timeframe] || 5;
            
            const { swingHighs, swingLows } = findSwingPoints(data.bars, lookback);
            
            if ((pattern === 'bos' && (swingHighs.length < 2 || swingLows.length < 2)) ||
                (pattern === 'choch' && (swingHighs.length < 3 || swingLows.length < 3))) {
                console.log(`  ⚠ Insufficient swings for ${symbol}: ${swingHighs.length} highs, ${swingLows.length} lows (${data.bars.length} bars, lookback=${lookback})`);
                continue;
            }
            
            // Check only the latest bar
            if (pattern === 'choch') {
                const chochResult = detectCHOCH(data.bars, lookback);
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
                const bosResult = detectBOS(data.bars, lookback);
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
            if (!data || data.bars.length < 10) {
                continue;
            }
            
            const bosResult = detectBOS(data.bars, 5);
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stock BOS Detector server running on http://localhost:${PORT}`);
    console.log(`Network access: http://192.168.1.13:${PORT}`);
    console.log(`Monitoring ${INDIAN_STOCKS.length} Indian stocks`);
});
