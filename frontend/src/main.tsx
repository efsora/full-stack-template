import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '../i18n.ts';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
);
