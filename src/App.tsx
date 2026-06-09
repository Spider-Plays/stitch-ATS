import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/Toaster'
import { ConfirmHost } from './components/ui/ConfirmHost'
import { queryClient } from './lib/queryClient'

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster />
                    <ConfirmHost />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App
