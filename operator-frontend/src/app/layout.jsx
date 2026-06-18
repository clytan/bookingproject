import './globals.css';

export const metadata = {
  title: 'COKALO Activity Operator',
  description: 'Manage slots and bookings for your water activity.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
