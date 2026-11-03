import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "RYZELS AI WORKSPACE — Advanced Operations Management",
  description: "Enterprise Operations Control Center, Multi-Website Management, Task Assignment Engine & Automated Reminders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <Sidebar />
        <Header />
        <main className="pl-64 pt-16 min-h-screen bg-slate-950">
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
