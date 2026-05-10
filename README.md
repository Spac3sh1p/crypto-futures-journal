# Crypto Futures Journal

Local-first crypto futures trading journal and analytics platform. Inspired by [CoinMarketMan](https://app.coinmarketman.com).

## Features

- **Auto-import** trades from Bybit & Binance via read-only API keys
- **Multi-dimensional analysis**: PnL, win rate, profit factor, by coin/timeframe/direction/leverage/hold duration
- **Dashboard** with portfolio overview, daily stats, performance charts
- **Trade log** with filtering, sorting, tagging, and notes
- **100% local** — your data stays on your machine

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Exchange API**: ccxt (unified interface for Bybit/Binance)
- **Charts**: Recharts

## Quick Start

```bash
# Install dependencies
npm install

# Set up your API keys
cp .env.local.example .env.local
# Edit .env.local with your read-only API keys

# Initialize database
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── trades/        # Trade CRUD & queries
│   │   ├── exchanges/     # Exchange credential management
│   │   ├── sync/          # Trade import triggers
│   │   └── stats/         # Analytics endpoints
│   ├── page.tsx           # Dashboard
│   └── globals.css        # Theme (Pro Trading dark)
├── components/
│   ├── dashboard/         # Dashboard widgets
│   ├── trades/            # Trade list & detail
│   ├── charts/            # Analysis charts
│   └── ui/                # Shared UI primitives
├── lib/
│   ├── exchange/          # Bybit & Binance API adapters
│   ├── analysis/          # Metrics calculation engine
│   └── prisma.ts          # DB client singleton
└── generated/prisma/      # Generated Prisma client
```

## Security

- Only **read-only** API keys are used — no withdrawal or trading permissions
- Keys are stored in `.env.local` (gitignored) and only accessed server-side
- Bind your API keys to `127.0.0.1` in exchange settings for extra safety

## License

MIT
