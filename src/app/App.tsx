import { Route, Routes } from 'react-router-dom'
import AdminRoutes from './AdminRoutes'

function App() {
    return (
        <div className="min-h-screen bg-bg">
            <Routes>
                <Route path="/*" element={<AdminRoutes />} />
            </Routes>
        </div>
    )
}

export default App
