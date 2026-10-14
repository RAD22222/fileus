import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initRipples } from './lib/ripple';
import './index.css';

initRipples();

createRoot(document.getElementById('root')!).render(<App />);
