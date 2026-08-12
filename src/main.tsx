import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted, not the Google CDN: the game must work offline and the PNG export
// needs the faces present at draw time (PRD §2.1, §5.2).
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/spectral/600.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';

import App from './App';
import './styles/tokens.css';
import './styles/global.css';

const container = document.getElementById('root');
if (container === null) throw new Error('#root missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
