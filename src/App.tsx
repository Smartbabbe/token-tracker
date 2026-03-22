import { useState, useEffect, useCallback } from 'react'

interface Token {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency: number
  total_volume: number
  sparkline_in_7d: { price: number[] }
}

const TOP_IDS = ['bitcoin','ethereum','solana','binancecoin','ripple','cardano','avalanche-2','chainlink','uniswap','aave','matic-network','the-graph']
const WATCHLIST_KEY = 'cryptowatch-watchlist'

const fmt = (n: number, decimals = 2) => {
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  return `$${n.toFixed(n < 1 ? 6 : decimals)}`
}

const pctColor = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-rose-400'
const pctBg    = (v: number) => v >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (!prices?.length) return null
  const w = 80, h = 32
  const min = Math.min(...prices), max = Math.max(...prices)
  const range = max - min || 1
  const pts = prices.map((p, i) => `${(i/(prices.length-1))*w},${h - ((p-min)/range)*h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={positive ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TokenRow({ token, inWatchlist, onToggle, rank }: { token: Token; inWatchlist: boolean; onToggle: () => void; rank: number }) {
  const p24 = token.price_change_percentage_24h
  const p7d = token.price_change_percentage_7d_in_currency
  const sparkPrices = token.sparkline_in_7d?.price?.filter((_, i) => i % 12 === 0) || []

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors group">
      <td className="py-4 px-4 text-zinc-500 font-mono text-sm w-10">{rank}</td>
      <td className="py-4 px-2">
        <div className="flex items-center gap-3">
          <img src={token.image} alt={token.name} className="w-8 h-8 rounded-full" />
          <div>
            <p className="font-semibold text-white text-sm">{token.name}</p>
            <p className="text-zinc-500 text-xs uppercase font-mono">{token.symbol}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right font-mono font-semibold text-white">{fmt(token.current_price)}</td>
      <td className="py-4 px-4 text-right">
        <span className={`text-sm font-mono font-semibold ${pctColor(p24)}`}>
          {p24 >= 0 ? '+' : ''}{p24?.toFixed(2)}%
        </span>
      </td>
      <td className="py-4 px-4 text-right hidden md:table-cell">
        <span className={`text-sm font-mono font-semibold ${pctColor(p7d)}`}>
          {p7d >= 0 ? '+' : ''}{p7d?.toFixed(2)}%
        </span>
      </td>
      <td className="py-4 px-4 text-right hidden lg:table-cell">
        <p className="text-zinc-300 text-sm font-mono">{fmt(token.market_cap)}</p>
      </td>
      <td className="py-4 px-4 text-right hidden lg:table-cell">
        <p className="text-zinc-400 text-sm font-mono">{fmt(token.total_volume)}</p>
      </td>
      <td className="py-4 px-4 hidden md:table-cell">
        <Sparkline prices={sparkPrices} positive={(p7d || 0) >= 0} />
      </td>
      <td className="py-4 px-4">
        <button
          onClick={onToggle}
          className={`text-lg transition-transform hover:scale-125 ${inWatchlist ? 'text-yellow-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}
        >
          {inWatchlist ? '★' : '☆'}
        </button>
      </td>
    </tr>
  )
}

export default function App() {
  const [tokens,    setTokens]    = useState<Token[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState<'market' | 'watchlist'>('market')
  const [sort,      setSort]      = useState<{ key: string; dir: 1 | -1 }>({ key: 'market_cap_rank', dir: 1 })
  const [watchlist, setWatchlist] = useState<string[]>(() => JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]'))
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchTokens = useCallback(async () => {
    try {
      setError('')
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TOP_IDS.join(',')}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=7d`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Rate limited — retrying in 60s')
      const data = await res.json()
      setTokens(data)
      setLastUpdate(new Date())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 60000)
    return () => clearInterval(interval)
  }, [fetchTokens])

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist))
  }, [watchlist])

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const sortedTokens = [...tokens]
    .filter(t => {
      const q = search.toLowerCase()
      if (!q) return true
      return t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)
    })
    .filter(t => tab === 'watchlist' ? watchlist.includes(t.id) : true)
    .sort((a, b) => {
      const av = (a as any)[sort.key] ?? 0
      const bv = (b as any)[sort.key] ?? 0
      return (av > bv ? 1 : -1) * sort.dir
    })

  const setSort_ = (key: string) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: -1 })
  }

  const totalMcap = tokens.reduce((s, t) => s + t.market_cap, 0)
  const gainers = tokens.filter(t => t.price_change_percentage_24h > 0).length

  return (
    <div className="min-h-screen bg-[#080b10] text-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 md:px-10 py-5 flex items-center justify-between sticky top-0 bg-[#080b10]/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center">
            <span className="text-[#00d4aa] font-bold text-sm">₿</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">CryptoWatch</p>
            <p className="text-zinc-500 text-[10px] tracking-wider uppercase">Token Price Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
              Live · {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button onClick={fetchTokens} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors">
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Market stats */}
      <div className="px-6 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Market Cap', value: fmt(totalMcap), sub: `${tokens.length} assets tracked` },
          { label: '24h Gainers',      value: `${gainers}/${tokens.length}`,  sub: 'tokens up today' },
          { label: 'Top Token',        value: tokens[0]?.symbol?.toUpperCase() || '—', sub: fmt(tokens[0]?.current_price || 0) },
          { label: 'Watchlist',        value: `${watchlist.length}`,           sub: 'tokens tracked' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 text-xs mb-1">{s.label}</p>
            <p className="font-mono font-bold text-white text-xl">{s.value}</p>
            <p className="text-zinc-600 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-6 md:px-10 flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tokens..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00d4aa]/50 transition-colors"
          />
        </div>
        <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1">
          {(['market','watchlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-[#00d4aa] text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {t}{t === 'watchlist' && watchlist.length > 0 ? ` (${watchlist.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 md:px-10 pb-16">
        {error && (
          <div className="bg-rose-900/20 border border-rose-800/50 rounded-xl p-4 mb-4 text-rose-400 text-sm">⚠️ {error}</div>
        )}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ) : sortedTokens.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-3">🔍</p>
            <p>{tab === 'watchlist' ? 'No tokens in watchlist. Star tokens to add them.' : 'No tokens match your search.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  {[
                    { key: 'market_cap_rank', label: '#',     cls: 'w-10' },
                    { key: 'name',            label: 'Token', cls: '' },
                    { key: 'current_price',   label: 'Price', cls: 'text-right' },
                    { key: 'price_change_percentage_24h', label: '24h', cls: 'text-right' },
                    { key: 'price_change_percentage_7d_in_currency', label: '7d', cls: 'text-right hidden md:table-cell' },
                    { key: 'market_cap',      label: 'Mkt Cap', cls: 'text-right hidden lg:table-cell' },
                    { key: 'total_volume',    label: 'Volume', cls: 'text-right hidden lg:table-cell' },
                    { key: '',                label: '7d Chart', cls: 'hidden md:table-cell' },
                    { key: '',                label: '',       cls: 'w-8' },
                  ].map(col => (
                    <th key={col.label}
                      onClick={() => col.key && setSort_(col.key)}
                      className={`py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${col.cls} ${col.key ? 'cursor-pointer hover:text-zinc-300 transition-colors' : ''}`}>
                      {col.label} {col.key && sort.key === col.key ? (sort.dir === 1 ? '↑' : '↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTokens.map(token => (
                  <TokenRow key={token.id} token={token} rank={token.market_cap_rank} inWatchlist={watchlist.includes(token.id)} onToggle={() => toggleWatchlist(token.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
