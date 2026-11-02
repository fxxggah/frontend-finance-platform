import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
export const metadata: Metadata = { title: 'FIN — Suas finanças, mais simples', description: 'Acompanhe suas finanças pessoais de forma clara e tranquila.' }
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#EDEFFA', userScalable: false }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body className={`${inter.variable} antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }
