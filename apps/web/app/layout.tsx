import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASTRANEX CYBER RANGE | Operation Blackout',
  description: 'Internal Technical Assessment Platform - AstraNex Defence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://astranex-cyber-range.onrender.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://astranex-cyber-range.onrender.com" />
      </head>
      <body className="bg-defence-bg text-defence-heading min-h-screen antialiased selection:bg-defence-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
