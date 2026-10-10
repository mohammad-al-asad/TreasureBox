import type { Metadata } from "next";
import { Faustina, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const faustina = Faustina({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

import ReduxProvider from "@/redux/provider";
import AuthGuard from "@/components/AuthGuard";
import RealtimeNotificationListener from "@/components/RealtimeNotificationListener";

export const metadata: Metadata = {
  title: "Treasure Box Command Room",
  description: "The private command room for Treasure Box operators.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${faustina.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-white text-[#1C2522] selection:bg-[#E1BF62] selection:text-[#0D2823]"
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(event) {
                  var reasonStr = String(event && event.reason ? (event.reason.stack || event.reason.message || event.reason) : '');
                  if (reasonStr.includes('M_ID') || reasonStr.includes('chrome-extension://')) {
                    event.preventDefault();
                    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
                  }
                });
              }
            `,
          }}
        />
        <ReduxProvider>
          <AuthGuard>
            <RealtimeNotificationListener />
            {children}
          </AuthGuard>
        </ReduxProvider>
      </body>
    </html>
  );
}

