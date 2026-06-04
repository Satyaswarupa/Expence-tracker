import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata = {
  title: 'SpendWise — Expense Tracker',
  description: 'Track your expenses, visualize spending patterns, and take control of your finances.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <SocketProvider>
            <Sidebar />
            <div className="lg:pl-64">
              <Navbar />
              <main>{children}</main>
            </div>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
