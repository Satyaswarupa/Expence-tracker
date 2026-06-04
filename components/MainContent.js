'use client'

import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export default function MainContent({ children }) {
  const { user } = useAuth()
  return (
    <div className={user ? 'lg:pl-64' : ''}>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
