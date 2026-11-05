import { useState } from 'react';
import GuestLookup from './components/GuestLookup';
import Organizer from './components/Organizer';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const organizer = path.startsWith('/organizer');
  const go = (next: string) => { window.history.pushState({}, '', next); setPath(next); window.scrollTo(0, 0); };
  window.onpopstate = () => setPath(window.location.pathname);
  return organizer ? <Organizer onHome={() => go('/')} /> : <GuestLookup onOrganizer={() => go('/organizer')} />;
}
