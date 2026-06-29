import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata = {
  title: 'MoneyJot — Expense Tracker',
  description: 'Jot every rupee. Track daily spends, split shared bills, and follow money you’ve lent — all in one warm little place.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable}`}>
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
