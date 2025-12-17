import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { baseURL } from "@/baseUrl";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import { NextChatSDKBootstrap } from "@/src/components/shared/next-chat-sdk-bootstrap";
import Link from "next/link";

declare global {
  interface AppsSDKUIConfig {
    LinkComponent: typeof Link;
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axite MCP Template",
  description: "Production-ready ChatGPT MCP application template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <NextChatSDKBootstrap baseUrl={baseURL} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppsSDKUIProvider linkComponent={Link}>
          {children}
        </AppsSDKUIProvider>
      </body>
    </html>
  );
}


