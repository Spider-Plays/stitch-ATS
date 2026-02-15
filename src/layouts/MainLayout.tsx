import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const MainLayout = () => {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 ml-64 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default MainLayout
