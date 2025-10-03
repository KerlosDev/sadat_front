import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const rubik = localFont({
  src: "./fonts/rubik.ttf",
  variable: "--font-rubik",
  weight: "100 900",
});

export const metadata = {
  title: "University ERP System",
  description: "Comprehensive university management system with attendance tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${rubik.variable} font-rubik antialiased bg-slate-900`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                fontFamily: 'var(--font-rubik)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
