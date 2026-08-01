export interface WatchlistItem { symbol: string; name: string; price: string; change: string; positive: boolean }

interface WatchlistProps { items: WatchlistItem[]; selected: string; onSelect: (symbol: string) => void }

function Watchlist({ items, selected, onSelect }: WatchlistProps) {
  return <aside className="watchlist-panel"><div className="panel-title"><span>Watchlist</span><span className="live-dot">LIVE</span></div><div className="watchlist-items">{items.map((item) => <button type="button" key={item.symbol} className={`watchlist-item${item.symbol === selected ? ' active' : ''}`} onClick={() => onSelect(item.symbol)}><span><strong>{item.symbol}</strong><small>{item.name}</small></span><span className="watch-price"><strong>${item.price}</strong><small className={item.positive ? 'positive' : 'negative'}>{item.change}</small></span></button>)}</div></aside>
}

export default Watchlist
