import { FormEvent, useState } from 'react';
import { api, ApiError, Guest } from '../api';

const COUPLE = import.meta.env.VITE_COUPLE_NAMES || 'Alex & Jordan';
const EVENT_DATE = import.meta.env.VITE_WEDDING_DATE || 'Our wedding day';

export default function GuestLookup({ onOrganizer }: { onOrganizer: () => void }) {
  const [name, setName] = useState('');
  const [results, setResults] = useState<Guest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(event: FormEvent) {
    event.preventDefault();
    const query = name.trim();
    if (query.length < 2) { setError('Please enter at least 2 letters of your name.'); return; }
    setLoading(true); setError(''); setResults(null);
    try { setResults(await api.lookup(query)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'We could not search right now. Please try again.'); }
    finally { setLoading(false); }
  }

  return <main className="guest-page">
    <header className="site-header"><a className="brand" href="/" aria-label="Ever After home"><span className="brand-mark">e</span><span>ever after</span></a><button className="text-button organizer-link" onClick={onOrganizer}>Organizer <span aria-hidden="true">↗</span></button></header>
    <section className="guest-hero">
      <div className="eyebrow"><span className="eyebrow-line"/> THE WEDDING OF <span className="eyebrow-line"/></div>
      <p className="guest-couple">{COUPLE}</p><p className="guest-date">{EVENT_DATE}</p>
      <h1>Find your<br/><em>seat.</em></h1>
      <p className="hero-copy">We’re so glad you’re here. Look up your name to find your table and settle in for the celebration.</p>
      <form className="lookup-card" onSubmit={search}>
        <label htmlFor="guest-name">Your name</label>
        <div className="search-field"><span className="search-icon" aria-hidden="true">⌕</span><input id="guest-name" autoComplete="name" placeholder="Start typing your name…" value={name} onChange={e => setName(e.target.value)} /><button className="search-button" aria-label="Search for my seat" disabled={loading}>{loading ? <span className="spinner"/> : <span aria-hidden="true">→</span>}</button></div>
        <div className="form-note"><span className="lock-icon">⌑</span> Only matching names are shown in your search.</div>
      </form>
      {error && <p className="feedback error" role="alert">{error}</p>}
      {results && <div className="results-wrap" aria-live="polite">
        {results.length === 0 ? <div className="empty-result"><span className="empty-icon">⌕</span><strong>No match just yet</strong><p>Try a different spelling or just your first or last name.</p></div> : <>
          <p className="results-caption">{results.length === 1 ? 'WE FOUND YOUR PLACE' : `WE FOUND ${results.length} MATCHES`}</p>
          <div className="results-list">{results.map(guest => <article className="seat-card" key={guest.id}><div><span className="seat-name">{guest.name}</span><span className="seat-table-label">TABLE</span></div><div className="table-badge">{guest.tableName}</div></article>)}</div>
          {results.length > 1 && <p className="multi-match">If you see your name more than once, ask a member of our wedding team to help.</p>}
        </>}
      </div>}
      <div className="guest-footer"><span>Made for a day worth remembering</span><span className="footer-heart">♥</span></div>
    </section>
  </main>;
}
