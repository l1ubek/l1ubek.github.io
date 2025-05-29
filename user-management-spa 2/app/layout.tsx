import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'user admin',
  description: 'user admin',
  generator: 'user admin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
