import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: '5m-mcp',
    template: '%s · 5m-mcp',
  },
  description: 'Let any MCP agent build, run, and debug FiveM resources live.',
  metadataBase: new URL('https://mysbryce.github.io/5m-mcp'),
  openGraph: {
    title: '5m-mcp',
    description:
      'A FiveM resource that hands the keys to your AI agent — safely.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
