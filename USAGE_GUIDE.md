# Usage Guide - Stock Pattern Detector

## Overview

This application now supports detecting two important trading patterns in Indian stocks:
1. **BOS (Break of Structure)** - Trend continuation signals
2. **CHOCH (Change of Character)** - Trend reversal signals

All detections are based on **today's closing prices**, not yesterday's.

## How to Use

### 1. Start the Server

```bash
cd stock-bos-detector
npm start
```

The server will start on http://localhost:3000

### 2. Open the Application

Navigate to http://localhost:3000 in your web browser.

### 3. Select Pattern Type

At the top of the page, you'll see two radio buttons:
- **BOS (Break of Structure)** - Default selection
- **CHOCH (Change of Character)**

Select the pattern you want to detect.

### 4. Scan for Stocks

Click the **"Scan"** button to start scanning. The application will:
- Fetch historical data for all 50 Nifty 50 Index stocks
- Analyze each stock for the selected pattern
- Display results in ~50-90 seconds

### 5. View Results

Results are displayed as cards with the following information:
- **Stock Symbol and Name**
- **Pattern Type Badge** (Bullish/Bearish BOS or CHOCH)
- **Previous Trend** (CHOCH only - shows if it was in uptrend or downtrend)
- **Current Price** (Today's closing price)
- **Change Today** (Price movement today)
- **Pattern Date** (When the pattern occurred - today)
- **Break Price** (The closing price that broke the structure)
- **Structure Level** (The swing high/low that was broken)
- **Structure Date** (When the structure was formed)

### 6. Filter Results

Use the filter tabs to view:
- **All** - All detected stocks
- **Bullish** - Only bullish patterns (upward momentum)
- **Bearish** - Only bearish patterns (downward momentum)

## Pattern Explanations

### BOS (Break of Structure)

**Indicates: Trend Continuation**

#### Bullish BOS
- Market is in an uptrend
- Today's close is above a previous swing high
- Signal: Strong upward momentum, trend continues up
- Trading Implication: Look for long opportunities

#### Bearish BOS
- Market is in a downtrend
- Today's close is below a previous swing low
- Signal: Strong downward momentum, trend continues down
- Trading Implication: Look for short opportunities or avoid longs

### CHOCH (Change of Character)

**Indicates: Potential Trend Reversal**

#### Bullish CHOCH
- Market WAS in a downtrend (lower highs, lower lows)
- Today's close is above a previous swing high
- Signal: Trend character is changing, potential reversal to uptrend
- Trading Implication: Early signal for trend reversal up, prepare for long positions

#### Bearish CHOCH
- Market WAS in an uptrend (higher highs, higher lows)
- Today's close is below a previous swing low
- Signal: Trend character is changing, potential reversal to downtrend
- Trading Implication: Early signal for trend reversal down, exit longs or prepare for shorts

## API Usage

### Detect BOS Patterns
```bash
curl "http://localhost:3000/api/stocks?pattern=bos"
```

### Detect CHOCH Patterns
```bash
curl "http://localhost:3000/api/stocks?pattern=choch"
```

### Response Format
```json
{
  "success": true,
  "pattern": "BOS",
  "count": 5,
  "stocks": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries Limited",
      "pattern": "BOS",
      "type": "Bullish",
      "date": "2026-02-28",
      "breakPrice": 2450.50,
      "structurePrice": 2400.00,
      "structureDate": "2026-02-20",
      "close": 2450.50,
      "change": 15.25,
      "changePercent": 0.63
    }
  ],
  "scannedCount": 50,
  "timestamp": "2026-02-28T17:54:00.000Z"
}
```

For CHOCH patterns, stocks will also include:
```json
{
  "previousTrend": "Downtrend"  // or "Uptrend"
}
```

## Key Differences

| Aspect | BOS | CHOCH |
|--------|-----|-------|
| **Meaning** | Break of Structure | Change of Character |
| **Signal** | Trend Continuation | Trend Reversal |
| **Context** | With the trend | Against the trend |
| **Reliability** | High (confirms trend) | Medium (early reversal signal) |
| **Risk** | Lower (trending) | Higher (reversal might fail) |
| **Trading Use** | Add to positions | Watch for reversal |

## Tips

1. **BOS is more reliable** - Use for trend-following strategies
2. **CHOCH is early warning** - Use for catching reversals early, but confirm with other indicators
3. **Combine patterns** - If yesterday had CHOCH and today has BOS in the same direction, it's a strong reversal confirmation
4. **Check volume** - High volume on pattern days increases reliability (not shown in app currently)
5. **Use with other indicators** - RSI, MACD, support/resistance levels
6. **Risk management** - Always use stop losses, especially on CHOCH trades

## Troubleshooting

**No results found?**
- The market might not have shown patterns today
- Try scanning during market hours or shortly after close
- Try the other pattern type

**Server not responding?**
- Check if the server is running on port 3000
- Restart the server: `npm start`

**Slow scanning?**
- Normal - fetching data for 50 Nifty 50 stocks takes 50-90 seconds
- The delay prevents rate limiting from Yahoo Finance

## Next Steps

After identifying patterns:
1. Verify the stock chart manually
2. Check other technical indicators
3. Review fundamental news
4. Plan your entry/exit points
5. Set appropriate stop losses
6. Execute your trade with proper risk management

---

**Remember**: These patterns are tools to aid decision-making, not guarantees. Always do your own research and use proper risk management.
