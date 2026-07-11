import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SocketProvider } from '@/context/SocketContext'
import Sidebar from '@/components/Sidebar'
import MainContent from '@/components/MainContent'

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const SITE_URL = 'https://moneyjot.vercel.app'
const CREATOR_NAME = 'Satyaswarupa Parida'
const CREATOR_URL = 'https://www.linkedin.com/in/satyaswarupa/'
const SITE_DESCRIPTION = 'MoneyJot is a real-time expense tracker built by Satyaswarupa Parida. Track daily spends, split shared bills, and follow money you’ve lent — all in one warm little place.'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MoneyJot — Expense Tracker by Satyaswarupa Parida',
    template: '%s · MoneyJot',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Satyaswarupa Parida',
    'MoneyJot',
    'expense tracker',
    'budget tracker app',
    'personal finance tracker',
    'split bills app',
    'money lending tracker',
  ],
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'MoneyJot',
    locale: 'en_US',
    title: 'MoneyJot — Expense Tracker by Satyaswarupa Parida',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoneyJot — Expense Tracker by Satyaswarupa Parida',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: CREATOR_NAME,
      url: CREATOR_URL,
      sameAs: [CREATOR_URL],
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#webapp`,
      name: 'MoneyJot',
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      author: { '@id': `${SITE_URL}/#person` },
      creator: { '@id': `${SITE_URL}/#person` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
