import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted variable fonts, optical-size axis, roman only (PF-003 P2); each @font-face covers one unicode-range subset.
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import { App } from './app/App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
    throw new Error('index.html has no #root element');
}

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
