import './globals.css';

export const metadata = {
  title: 'COKALO Admin Dashboard',
  description: 'Manage buses, routes, schedules, bookings and users.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
