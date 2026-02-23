import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';


import App from './App';
import AuthProvider from '@/lib/AuthContext';
import { QueryProvider } from './lib/react-query/QueryProvider';
import { Analytics } from "@vercel/analytics/react"
import { PlayerProvider } from './context/PlayerContext';
import { HelmetProvider } from 'react-helmet-async';


ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <QueryProvider>
            <AuthProvider>
                <Analytics/>
                    <PlayerProvider>
                        <HelmetProvider>
                        <App/>
                        </HelmetProvider>
                    </PlayerProvider>
            </AuthProvider>
        </QueryProvider>
    </BrowserRouter>
)