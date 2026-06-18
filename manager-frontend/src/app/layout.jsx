import './globals.css';

export const metadata = {
  title: 'COKALO Hotel Manager',
  description: 'Manage rooms and bookings for your hotel.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
