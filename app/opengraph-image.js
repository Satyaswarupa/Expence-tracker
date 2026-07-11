import { ImageResponse } from 'next/og'

export const alt = 'MoneyJot — Expense Tracker by Satyaswarupa Parida'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0C11',
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(242,103,63,0.35), transparent 45%), radial-gradient(circle at 85% 85%, rgba(52,211,153,0.25), transparent 45%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 110,
              height: 110,
              borderRadius: 28,
              background: '#F2673F',
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', fontSize: 90, fontWeight: 800, color: '#F3F3F6' }}>
            MoneyJot
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 32, color: '#C7C8D3' }}>
          Track spends · Split bills · Follow money you&apos;ve lent
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 26, color: '#8D8E9C' }}>
          Built by Satyaswarupa Parida
        </div>
      </div>
    ),
    { ...size }
  )
}
