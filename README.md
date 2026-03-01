# Indian Stock Pattern Detector (BOS & CHOCH)

A web application that detects and displays Indian stocks with BOS (Break of Structure) and CHOCH (Change of Character) patterns that closed today.

## What are BOS and CHOCH?

### BOS (Break of Structure)
Indicates trend continuation:

- **Bullish BOS**: When the candle **crosses above** AND **closes above** a previous swing high, confirming strong upward momentum and trend continuation.
- **Bearish BOS**: When the candle **crosses below** AND **closes below** a previous swing low, confirming strong downward momentum and trend continuation.

### CHOCH (Change of Character)
Indicates potential trend reversal:

- **Bullish CHOCH**: In a downtrend, when the candle **crosses above** AND **closes above** a previous swing high, signaling potential reversal to uptrend.
- **Bearish CHOCH**: In an uptrend, when the candle **crosses below** AND **closes below** a previous swing low, signaling potential reversal to downtrend.

**Important**: Both patterns require TWO conditions:
1. **Price must CROSS the level** - The high (for bullish) or low (for bearish) must breach the structure
2. **Price must CLOSE beyond the level** - The closing price must confirm the break

This double-confirmation provides much stronger, more reliable trading signals by filtering out weak touches and gap moves that don't hold.

## Features

- 📊 Scans all 50 stocks in the **Nifty 50 Index**
- 🔍 Detects both BOS and CHOCH patterns with **cross + close confirmation**
- ⏱️ **Multiple Timeframes**: Daily (1D), Weekly (1W), Monthly (1M)
- 📈 Shows detailed information about each pattern occurrence
- 🎯 Filter stocks by pattern type (All/Bullish/Bearish)
- 🔄 Switch between BOS and CHOCH detection
- 📊 **Latest Candle Analysis** - Detects patterns on the most recent candle
- 💎 Beautiful, modern UI with responsive design
- ⚡ Real-time data from Yahoo Finance
- ✨ **Professional-grade detection** - Same logic used by institutional traders

## How It Works

1. Fetects historical data for the selected timeframe (Daily/Weekly/Monthly)
2. Identifies swing highs and swing lows using a 5-bar lookback period
3. For BOS: Detects when the latest candle **crossed AND closed** through previous swing points (trend continuation)
4. For CHOCH: Detects when the latest candle **crossed AND closed** through previous swing points in opposite direction of current trend (potential reversal)
5. Displays stocks that have confirmed patterns on the most recent candle

## Stocks Monitored

The application monitors all **50 stocks in the Nifty 50 Index**. [See complete list](NIFTY50_STOCKS.md)

### Highlights:

**Top Weighted Stocks:**
- RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK
- HINDUNILVR, ITC, SBIN, BHARTIARTL, KOTAKBANK

**Sectors Covered:**
- IT & Technology: TCS, INFY, WIPRO, TECHM, HCLTECH, LTIM
- Banking & Finance: HDFCBANK, ICICIBANK, SBIN, KOTAKBANK, AXISBANK, BAJFINANCE, BAJAJFINSV, INDUSINDBK
- Energy: RELIANCE, ONGC, BPCL, IOC, COALINDIA, ADANIENT
- Auto: MARUTI, M&M, TATAMOTORS, BAJAJ-AUTO, HEROMOTOCO, EICHERMOT
- Metals: TATASTEEL, HINDALCO, JSWSTEEL, VEDL
- Pharma: SUNPHARMA, DIVISLAB, DRREDDY, CIPLA, APOLLOHOSP
- FMCG: HINDUNILVR, ITC, NESTLEIND, BRITANNIA, TATACONSUM
- Infrastructure: LT, NTPC, POWERGRID, ADANIPORTS
- And all other Nifty 50 constituents

## Installation

```bash
cd stock-bos-detector
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Select timeframe:
   - **Daily (1D)** - For day traders and short-term swings
   - **Weekly (1W)** - For swing traders
   - **Monthly (1M)** - For position traders and investors

4. Select pattern type (BOS or CHOCH)

5. Click the "Scan" button to detect stocks with the selected pattern on the latest candle

## Technical Details

- **Backend**: Node.js with Express
- **Data Source**: Yahoo Finance API
- **Frontend**: Vanilla JavaScript with modern CSS
- **BOS Detection**: Custom algorithm using swing point analysis

## API Endpoints

### Get Stocks with Pattern
```
GET /api/stocks?pattern=bos&timeframe=1d
GET /api/stocks?pattern=choch&timeframe=1wk
GET /api/stocks?pattern=bos&timeframe=1mo
```

Returns all stocks that have the specified pattern on the latest candle of the selected timeframe.

**Query Parameters:**
- `pattern`: Either `bos` or `choch` (default: `bos`)
- `timeframe`: Either `1d`, `1wk`, or `1mo` (default: `1d`)

**Examples:**
```bash
# Get daily BOS patterns on latest candle
curl "http://localhost:3000/api/stocks?pattern=bos&timeframe=1d"

# Get weekly CHOCH patterns on latest candle
curl "http://localhost:3000/api/stocks?pattern=choch&timeframe=1wk"

# Get monthly BOS patterns on latest candle
curl "http://localhost:3000/api/stocks?pattern=bos&timeframe=1mo"
```

**Response:**
```json
{
  "success": true,
  "pattern": "BOS" | "CHOCH",
  "timeframe": "1d" | "1wk" | "1mo",
  "count": 5,
  "stocks": [...],
  "scannedCount": 50,
  "timestamp": "2026-02-28T..."
}
```

**Notes:** 
- Scans only the latest (most recent) candle for patterns
- Patterns require price to CROSS the structure level AND CLOSE beyond it for confirmation
- Each stock appears at most once in results

### Get Stock Details (Legacy)
```
GET /api/stock/:symbol
```

Returns historical data and BOS analysis for a specific stock.

## Pattern Detection Algorithms

### BOS Detection
1. **Swing Point Identification**: Uses a 5-bar lookback to identify swing highs and lows
2. **Structure Break Detection**: Compares today's close with previous swing points
3. **Validation**: Ensures multiple swing points exist for reliable detection
4. **Confirmation**: Only triggers when price closes beyond the structure level

### CHOCH Detection
1. **Trend Identification**: Analyzes recent swing highs and lows to determine current trend
   - Downtrend: Lower highs and lower lows
   - Uptrend: Higher highs and higher lows
2. **Counter-Trend Break**: Detects when today's close breaks a swing point opposite to the trend
3. **Reversal Signal**: Indicates potential trend reversal when structure breaks against current trend

## Requirements

- Node.js 14 or higher
- Internet connection for fetching stock data
- Modern web browser

## Notes

- Data is fetched from Yahoo Finance and may have a slight delay
- The application can scan for patterns across any date range (default: today only)
- Historical data goes back up to 60 days (configurable in server.js)
- Best used during market hours or shortly after market close for latest data
- Rate limiting is applied to avoid overwhelming the data source
- BOS indicates trend continuation; CHOCH indicates potential trend reversal
- Both patterns use closing prices for stronger confirmation
- A stock can appear multiple times if it has patterns on different dates in the range

## Testing

Run the test script to verify the BOS detection logic:

```bash
npm test
```

## License

MIT
