import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';


import App from './App';
import AuthProvider from '@/lib/AuthContext';
import { QueryProvider } from './lib/react-query/QueryProvider';
import { Analytics } from "@vercel/analytics/react"


ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <QueryProvider>
            <AuthProvider>
                <Analytics/>
                <App/>
            </AuthProvider>
        </QueryProvider>
    </BrowserRouter>
)