import './globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'COKALO - Book Buses & Hotels Online',
  description: 'One platform for buses and hotels in Sri Lanka. Compare fares, find great stays, book in seconds.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
