import type { Metadata } from "next";
import { ToastProvider } from "@/components/shared/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaims Ops",
  description: "Automate claims, stipends, and reimbursements for open pools with World ID.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans text-[var(--color-text)]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
