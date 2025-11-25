import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'SteadyLetters - AI-Powered Handwritten Letters'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #1e40af, #7c3aed)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 96, fontWeight: 'bold' }}>SteadyLetters</div>
        </div>
        <div style={{ fontSize: 32, marginTop: 20, opacity: 0.9 }}>
          AI-Powered Handwritten Letters
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
