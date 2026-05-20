import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/Toaster'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: true,
        },
    },
})

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster />
                </BrowserRouter>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App
