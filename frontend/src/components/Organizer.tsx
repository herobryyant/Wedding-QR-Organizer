import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { QRCodeSVG } from 'qrcode.react';
import { api, ApiError, Guest, GuestInput, tokenKey } from '../api';

const COUPLE = import.meta.env.VITE_COUPLE_NAMES || 'Alex & Jordan';
const EVENT_DATE = import.meta.env.VITE_WEDDING_DATE || 'Our wedding day';

type Tab = 'guests' | 'qr';

export default function Organizer({ onHome }: { onHome: () => void }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(tokenKey));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState({ guests: 0, tables: 0 });
  const [tab, setTab] = useState<Tab>('guests');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Guest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<GuestInput>({ name: '', tableName: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [guestRows, totals] = await Promise.all([api.guests(), api.stats()]);
      setGuests(guestRows); setStats(totals); setError('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setToken(null);
      setError(err instanceof Error ? err.message : 'Could not load guests.');
    }
  }
  useEffect(() => { if (token) void load(); }, [token]);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setLoginError('');
    try { const result = await api.login(password); sessionStorage.setItem(tokenKey, result.token); setToken(result.token); setPassword(''); }
    catch (err) { setLoginError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    try { await api.logout(); } catch { /* The local session is cleared even if the API is unavailable. */ }
    sessionStorage.removeItem(tokenKey); setToken(null); onHome();
  }

  function openCreate() { setEditing(null); setForm({ name: '', tableName: '' }); setShowForm(true); setError(''); }
  function openEdit(guest: Guest) { setEditing(guest); setForm({ name: guest.name, tableName: guest.tableName }); setShowForm(true); setError(''); }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function saveGuest(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editing) await api.updateGuest(editing.id, form); else await api.createGuest(form);
      closeForm(); setNotice(editing ? 'Guest details updated.' : 'Guest added to the list.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save guest.'); }
    finally { setBusy(false); }
  }

  async function removeGuest(guest: Guest) {
    if (!window.confirm(`Remove ${guest.name} from the guest list?`)) return;
    setError('');
    try { await api.deleteGuest(guest.id); setNotice(`${guest.name} was removed.`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not remove guest.'); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setBusy(true); setError(''); setNotice('');
    Papa.parse<Record<string, string>>(file, { header: true, skipEmptyLines: true, complete: async result => {
      const rows = result.data.map(row => {
        const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replace(/[ _-]/g, ''), value]));
        return { name: (normalized.name ?? normalized.fullname ?? '').trim(), tableName: (normalized.table ?? normalized.tablename ?? normalized.tableassignment ?? '').trim() };
      }).filter(row => row.name && row.tableName);
      if (!rows.length) { setError('No valid guest rows found. Use columns named name and table.'); setBusy(false); if (fileRef.current) fileRef.current.value = ''; return; }
      try { const result = await api.importGuests(rows); setNotice(`${result.imported} guest${result.imported === 1 ? '' : 's'} imported.`); await load(); }
      catch (err) { setError(err instanceof Error ? err.message : 'CSV import failed.'); }
      finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
    }, error: parseError => { setError(parseError.message); setBusy(false); if (fileRef.current) fileRef.current.value = ''; } });
  }

  function exportCsv() {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const text = ['name,table', ...guests.map(g => `${quote(g.name)},${quote(g.tableName)}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'wedding-guest-list.csv'; link.click(); URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['name,table\nJordan Lee,Table 1\nSam Rivera,Table 2\n'], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'guest-list-template.csv'; link.click(); URL.revokeObjectURL(url);
  }

  const filteredGuests = useMemo(() => guests.filter(g => `${g.name} ${g.tableName}`.toLowerCase().includes(search.toLowerCase())), [guests, search]);
  const shareUrl = `${window.location.origin}/`;

  if (!token) return <main className="admin-login-page"><header className="site-header"><a className="brand" href="/" onClick={e => { e.preventDefault(); onHome(); }}><span className="brand-mark">e</span><span>ever after</span></a><button className="text-button" onClick={onHome}>← Guest lookup</button></header><section className="login-card"><div className="login-icon">✳</div><p className="eyebrow">PRIVATE ORGANIZER AREA</p><h1>Welcome<br/><em>back.</em></h1><p className="login-copy">Sign in to manage your guest list and seating details.</p><form onSubmit={signIn}><label htmlFor="organizer-password">Organizer password</label><input id="organizer-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required/><button className="primary-button full-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <span>→</span></button></form>{loginError && <p className="feedback error" role="alert">{loginError}</p>}<button className="text-button back-link" onClick={onHome}>Return to guest lookup</button></section></main>;

  return <main className="admin-page">
    <aside className="admin-sidebar"><a className="brand" href="/" onClick={e => { e.preventDefault(); onHome(); }}><span className="brand-mark">e</span><span>ever after</span></a><div className="sidebar-event"><span className="sidebar-label">YOUR EVENT</span><strong>{COUPLE}</strong><span>{EVENT_DATE}</span></div><nav className="admin-nav"><button className={tab === 'guests' ? 'active' : ''} onClick={() => setTab('guests')}><span>♧</span> Guest list</button><button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}><span>▦</span> QR code</button></nav><div className="sidebar-bottom"><div className="secure-note"><span>◉</span><p>Only you can edit<br/>your guest list.</p></div><button className="sidebar-signout" onClick={() => void signOut()}>↪ &nbsp; Sign out</button></div></aside>
    <section className="admin-main"><header className="admin-topbar"><div className="mobile-brand"><span className="brand-mark">e</span> ever after</div><span className="admin-top-label"><i/> ORGANIZER DASHBOARD</span><button className="text-button view-guest" onClick={onHome}>View guest page ↗</button></header>
      <div className="admin-content">
        {notice && <div className="notice" role="status"><span>✓</span>{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}
        {error && <div className="notice notice-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
        {tab === 'guests' ? <>
          <div className="page-heading"><div><p className="eyebrow">THE DETAILS</p><h1>Guest <em>list</em></h1><p className="page-subtitle">Keep every seat in the right place.</p></div><button className="primary-button add-button" onClick={openCreate}><span>＋</span> Add guest</button></div>
          <div className="stat-grid"><div className="stat-card"><span className="stat-symbol">♧</span><div><span className="stat-number">{stats.guests}</span><span className="stat-label">GUESTS</span></div></div><div className="stat-card"><span className="stat-symbol">⌂</span><div><span className="stat-number">{stats.tables}</span><span className="stat-label">TABLES</span></div></div><div className="stat-card import-stat"><div><span className="stat-title">Working from a spreadsheet?</span><span className="stat-caption">Import your guest list in a few clicks.</span></div><button className="outline-button" disabled={busy} onClick={() => fileRef.current?.click()}>↑ Import CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e => void importFile(e)}/></div></div>
          <section className="guest-table-panel"><div className="panel-toolbar"><div><h2>All guests <span className="count-pill">{guests.length}</span></h2><p>Names and their assigned tables</p></div><div className="table-actions"><label className="table-search"><span>⌕</span><input aria-label="Filter guest list" placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)}/></label><button className="icon-button" aria-label="Export guest list as CSV" title="Export CSV" onClick={exportCsv}>↓</button></div></div>
            <div className="guest-table-scroll"><table className="guest-table"><thead><tr><th>GUEST NAME</th><th>TABLE</th><th className="actions-head">ACTIONS</th></tr></thead><tbody>{filteredGuests.map(guest => <tr key={guest.id}><td><span className="avatar">{guest.name.charAt(0).toUpperCase()}</span><span className="table-guest-name">{guest.name}</span></td><td><span className="table-cell-badge">{guest.tableName}</span></td><td className="row-actions"><button onClick={() => openEdit(guest)} aria-label={`Edit ${guest.name}`} title="Edit">✎</button><button onClick={() => void removeGuest(guest)} aria-label={`Remove ${guest.name}`} title="Remove">×</button></td></tr>)}</tbody></table>
              {!filteredGuests.length && <div className="table-empty"><span>{guests.length ? '⌕' : '✳'}</span><strong>{guests.length ? 'No guests match your search' : 'Your guest list is ready to begin'}</strong><p>{guests.length ? 'Try another name or table.' : 'Add someone or import your spreadsheet to get started.'}</p>{!guests.length && <button className="outline-button" onClick={downloadTemplate}>Download CSV template</button>}</div>}
            </div><div className="table-footer"><span>Showing {filteredGuests.length} of {guests.length} guests</span><button onClick={downloadTemplate}>CSV format guide ↗</button></div>
          </section>
        </> : <>
          <div className="page-heading"><div><p className="eyebrow">EASY TO FIND, EASY TO LOVE</p><h1>Your event <em>QR code</em></h1><p className="page-subtitle">One scan brings guests straight to their seat.</p></div></div>
          <section className="qr-content"><article className="qr-instructions"><div className="qr-step"><span>01</span><div><h3>Print or share</h3><p>Download the QR code and add it to your welcome sign, invitations, or table cards.</p></div></div><div className="qr-step"><span>02</span><div><h3>Guests scan</h3><p>They’ll land on your private seat finder and search their own name.</p></div></div><div className="qr-step"><span>03</span><div><h3>Everyone settles in</h3><p>Guests see only their matching seat results. Your full list stays in this dashboard.</p></div></div><div className="privacy-callout"><span>⌑</span><p><strong>Guest privacy matters.</strong><br/>Guests can search for a seat, but the full list is not browseable.</p></div></article><article className="qr-card"><div className="qr-card-top"><span className="eyebrow">SCAN TO FIND YOUR SEAT</span><span className="qr-live"><i/> LIVE</span></div><div className="qr-frame"><QRCodeSVG value={shareUrl} size={192} level="H" includeMargin fgColor="#23352f" bgColor="#ffffff"/><div className="qr-center-mark">e</div></div><h2>{COUPLE}</h2><p>{EVENT_DATE}</p><div className="qr-url">{shareUrl}</div><div className="qr-card-actions"><button className="primary-button" onClick={() => window.print()}>Print QR code <span>↗</span></button><button className="outline-button" onClick={() => { void navigator.clipboard?.writeText(shareUrl); setNotice('Guest page link copied.'); }}>Copy guest link</button></div></article></section>
        </>}
        <footer className="admin-footer"><span>EVER AFTER <b>·</b> MADE WITH CARE</span><span>Keep the day about the people you love.</span></footer>
      </div>
    </section>
    {showForm && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeForm(); }}><section className="guest-modal" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title"><button className="modal-close" onClick={closeForm} aria-label="Close">×</button><p className="eyebrow">GUEST DETAILS</p><h2 id="guest-modal-title">{editing ? 'Edit guest' : 'Add a guest'}</h2><p className="modal-copy">Add a name and the table where they’ll be seated.</p><form onSubmit={saveGuest}><label htmlFor="guest-full-name">Full name</label><input id="guest-full-name" autoFocus maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Taylor Morgan" required/><label htmlFor="guest-table">Table assignment</label><input id="guest-table" maxLength={80} value={form.tableName} onChange={e => setForm({ ...form, tableName: e.target.value })} placeholder="e.g. Table 4" required/><div className="modal-actions"><button type="button" className="outline-button" onClick={closeForm}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add guest'} <span>→</span></button></div></form></section></div>}
  </main>;
}
