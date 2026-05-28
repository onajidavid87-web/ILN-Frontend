import type { Metadata } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import I18nProvider from "@/components/I18nProvider";
import { ToastProvider } from "@/context/ToastContext";
import { WalletProvider } from "@/context/WalletContext";
import { NotificationProvider } from "@/context/NotificationContext";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import FABProvider from "@/components/FABProvider";
import CommandPalette from "@/components/CommandPalette";
import ContractEventSync from "@/components/ContractEventSync";
import Providers from "./Providers";


export const metadata: Metadata = {
  title: "ILN | Invoice Liquidity Network",
  description: "An open-source invoice factoring protocol on Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var prefTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (localTheme === 'dark' || (!localTheme && prefTheme)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="antialiased bg-background text-foreground transition-colors duration-300 selection:bg-primary-container selection:text-on-primary-container"
      >
        <I18nProvider>
          <Providers>
            <ToastProvider>
              <ContractEventSync />
              <WalletProvider>
                <NotificationProvider>
                  <FABProvider />
                  <div className="min-h-screen flex flex-col">
                    <div className="flex-1">
                      <Suspense fallback={null}>
                        {children}
                      </Suspense>
                    </div>
                  </div>
                  <Suspense fallback={null}>
                    <OnboardingFlow />
                  </Suspense>
                  <Suspense fallback={null}>
                    <CommandPalette />
                  </Suspense>
                </NotificationProvider>
              </WalletProvider>
            </ToastProvider>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
