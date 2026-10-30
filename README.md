# Crypto Futures Journal

Local-first crypto futures trading journal and analytics platform.

## Features

- Auto-import closed futures trades from Bybit and Binance with read-only API keys
- Track PnL, win rate, profit factor, drawdown, funding, fees, symbols, duration, and sizing
- Review recent trades with real market candles where supported
- Filter analytics by exchange and time range
- Keep data local in SQLite

## Tech Stack

- Frontend: Next.js 16.2.6 App Router, React 19, TypeScript, Tailwind CSS
- Database: SQLite via Prisma ORM
- Exchange API: ccxt plus exchange-specific adapters
- Charts: Recharts
- Tests: Vitest

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

## Project Structure

```text
src/
  app/
    api/                  Server routes for auth, exchanges, sync, trades, and market data
    dashboard/            Maintained dashboard pages
    globals.css           Theme tokens, fonts and shared UI classes
  components/
    analytics/            Analytics panels and reports
    calendar/             Monthly review UI
    dashboard/            Shell (sidebar, top bar), accounting notice, mini kline chart
    i18n/                 Locale provider and toggle
    overview/             Performance overview, equity chart, recent trades
    settings/             Exchange connection UI
    trades/               Trade history table, rows and detail panel
    ui/                   Panel, segmented control and bar primitives
  lib/
    analysis/             Metrics engine
    dashboard/            Dashboard queries and transforms
    exchange/             Exchange adapters
    market/               Market candle helpers
prisma/
  schema.prisma           SQLite schema
  migrations/             Database migrations
tests/                    Unit and route behavior tests
scripts/                  Local development and visual check helpers
```

## Security

- Use read-only API keys only.
- Store local secrets in `.env.local`; it is ignored by Git.
- Do not commit local databases, backups, logs, reports, or generated Prisma output.
