# CryptoWatch — Token Price Tracker

A real-time cryptocurrency price tracker built with React and TypeScript, powered by the CoinGecko public API. Clean, data-dense interface with live prices, 7-day sparkline charts, and a personal star watchlist.

**🔗 Live Demo:** https://token-tracker-beryl.vercel.app/

---

## Features

- **Live price data** — fetches real-time prices, market cap, and 24h volume from CoinGecko every 60 seconds
- **7-day sparkline charts** — inline SVG price trend visualisation for each token
- **Sortable columns** — click any column header to sort ascending or descending
- **Instant search** — filter tokens by name or symbol in real time
- **Star watchlist** — star any token to save it; persisted in localStorage across sessions
- **Market stats bar** — total market cap, 24h gainers count, top token, and watchlist size at a glance
- **Auto-refresh** — data refreshes every 60 seconds automatically, with a manual refresh button
- **Responsive** — works cleanly on mobile and desktop

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Vite | Build tool |
| CoinGecko API | Live price data (free tier, no key required) |

---

## API Notes

- Uses the [CoinGecko Markets API](https://www.coingecko.com/en/api) — no API key required
- Free tier is rate-limited to ~10–30 calls/minute; the app refreshes every 60 seconds to stay within limits
- If you see a rate limit error, wait 60 seconds and click Refresh
- Tracks 12 tokens by default: BTC, ETH, SOL, BNB, XRP, ADA, AVAX, LINK, UNI, AAVE, MATIC, GRT

---

## Built By

**Esther Okon** — Web3 Developer, DeFi Educator & Community Builder  
🌐 Portfolio: https://personal-portfolio-site-ten-rouge.vercel.app/  
🐦 Twitter: [@thesmarrtEsther](https://twitter.com/thesmarrtEsther)
