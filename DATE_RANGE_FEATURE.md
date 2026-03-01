# Date Range Filter Feature

## Overview

The Stock Pattern Detector now includes a powerful date range filter that allows you to scan for BOS and CHOCH patterns across any historical date range (up to 60 days back).

## How to Use

### Via UI

1. **Open the application** at http://localhost:3000

2. **Select Pattern Type** (BOS or CHOCH)

3. **Set Date Range**:
   - **From Date**: The starting date for your scan
   - **To Date**: The ending date for your scan
   - Both dates default to today when the page loads

4. **Common Scenarios**:
   
   **Scan Today Only:**
   - Set both dates to today (default)
   - Click "Reset" button to quickly set both to today
   
   **Scan Last Week:**
   - From Date: 7 days ago
   - To Date: Today
   
   **Scan Specific Date:**
   - Set both From and To to the same date
   
   **Scan Custom Range:**
   - Set any valid date range within the last 60 days

5. **Click "Scan"** to execute

### Via API

```bash
# Scan for BOS patterns on a specific date
curl "http://localhost:3000/api/stocks?pattern=bos&fromDate=2026-02-28&toDate=2026-02-28"

# Scan for CHOCH patterns over last week
curl "http://localhost:3000/api/stocks?pattern=choch&fromDate=2026-02-21&toDate=2026-02-28"

# Scan last 30 days
curl "http://localhost:3000/api/stocks?pattern=bos&fromDate=2026-01-29&toDate=2026-02-28"
```

## How It Works

### Single Date Detection

When you scan a specific date (fromDate = toDate):
- The application checks if any stocks formed a BOS/CHOCH pattern on that date
- Each stock appears at most once in results
- Shows the pattern that occurred on that specific date

### Date Range Detection

When you scan a date range (fromDate ≠ toDate):
- The application checks EVERY trading day within the range
- If a stock has patterns on multiple dates, it appears multiple times
- Each entry shows the date when that specific pattern occurred
- Useful for finding recurring patterns or multiple signals

### Example

If RELIANCE.NS had:
- Bullish BOS on 2026-02-20
- Bearish BOS on 2026-02-26
- Bullish CHOCH on 2026-02-28

And you scan BOS from 2026-02-20 to 2026-02-28:
- RELIANCE.NS will appear TWICE in results
- Once for the Bullish BOS on Feb 20
- Once for the Bearish BOS on Feb 26

## Results Display

Each result card shows:
- **Pattern Date**: The specific date the pattern occurred
- **Break Price**: The closing price on that date
- **Current Price**: The latest available closing price
- **Change Today**: Price movement from previous day to pattern date
- All other pattern details

The results header shows:
- Total number of pattern occurrences (not unique stocks)
- Date range scanned
- Pattern type

## Benefits

### 1. Historical Analysis
- Review patterns from past weeks
- Identify which stocks had signals and how they performed after
- Backtest your trading strategies

### 2. Pattern Frequency
- Find stocks with recurring BOS signals (strong trend)
- Find stocks with multiple CHOCH signals (high volatility)
- Identify the most active stocks

### 3. Missed Opportunities
- Check what patterns you missed while away
- Review patterns from days you couldn't trade
- Learn from historical setups

### 4. Strategy Development
- Analyze pattern effectiveness over time
- Compare BOS vs CHOCH performance
- Identify best performing pattern days

### 5. Custom Scans
- Scan specific weeks (earnings season, event-driven)
- Focus on particular market conditions
- Filter noise by controlling time window

## Limitations

1. **Historical Data**: Limited to last 60 days (configurable in server.js)
2. **Processing Time**: Longer date ranges take more time to process
3. **Duplicate Stocks**: Same stock can appear multiple times if it has patterns on different dates
4. **Data Availability**: Yahoo Finance must have data for the requested dates

## Tips

1. **Start with Single Date**: Test with today's date first to understand the output
2. **Expand Gradually**: Then try last week, then longer ranges
3. **Filter Results**: Use the Bullish/Bearish tabs to focus on specific signals
4. **Track Performance**: Note the pattern dates and check how the stocks performed afterward
5. **Weekend Dates**: The app only processes trading days; weekends are automatically skipped

## Technical Details

### Date Format
- All dates use **YYYY-MM-DD** format (e.g., 2026-02-28)
- Times are not supported (only dates)
- Dates are compared in local timezone

### Validation
- From Date cannot be after To Date
- Both dates must be provided (or neither for latest bar)
- Invalid dates are rejected with error message

### Performance
- ~50-90 seconds for single date scan (50 Nifty 50 stocks)
- Proportionally longer for wider date ranges
- Rate limiting applied (100ms delay between stocks)

## Use Cases

### Day Traders
- Scan today only at market open
- Look for overnight patterns
- Quick daily checks

### Swing Traders
- Scan last 5-7 days
- Find recent patterns still valid
- Weekly pattern analysis

### Position Traders
- Scan last 30 days
- Identify strong trending stocks (multiple BOS)
- Find major reversals (CHOCH)

### Backtesting
- Scan specific historical periods
- Analyze pattern success rates
- Compare different market conditions

## API Response Structure

```json
{
  "success": true,
  "pattern": "BOS",
  "count": 12,
  "stocks": [
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries",
      "pattern": "BOS",
      "type": "Bullish",
      "date": "2026-02-20",
      "breakPrice": 2450.50,
      "structurePrice": 2400.00,
      "structureDate": "2026-02-15",
      "close": 2465.00,
      "change": 15.25,
      "changePercent": 0.63
    },
    {
      "symbol": "RELIANCE.NS",
      "name": "Reliance Industries",
      "pattern": "BOS",
      "type": "Bearish",
      "date": "2026-02-26",
      "breakPrice": 2350.00,
      "structurePrice": 2380.00,
      "structureDate": "2026-02-22",
      "close": 2465.00,
      "change": -12.50,
      "changePercent": -0.53
    }
  ],
  "scannedCount": 50,
  "dateRange": {
    "from": "2026-02-20",
    "to": "2026-02-28"
  },
  "timestamp": "2026-02-28T18:00:00.000Z"
}
```

Note: Same stock appears twice with different dates and pattern details.

## Future Enhancements

Potential future features:
- CSV export of results
- Group by stock option (show unique stocks only)
- Pattern count per stock
- Performance tracking after pattern
- Email alerts for patterns in date range
- Save and load custom date ranges

---

**Happy Trading!** Use the date range feature to gain deeper insights into market patterns and improve your trading strategy.
