import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'

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
        <ClerkProvider>
          <AuthProvider>
            <SocketProvider>
              <Sidebar />
              <MainContent>{children}</MainContent>
            </SocketProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
