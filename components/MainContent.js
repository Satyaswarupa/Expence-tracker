'use client'

import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import AiChat from '@/components/AiChat'

export default function MainContent({ children }) {
  const { user } = useAuth()
  return (
    <div className={user ? 'lg:pl-64' : ''}>
      <Navbar />
      <main>{children}</main>
      {user && <AiChat />}
    </div>
  )
}
