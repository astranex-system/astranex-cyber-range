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
      <body className="bg-defence-bg text-defence-heading min-h-screen antialiased selection:bg-defence-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
