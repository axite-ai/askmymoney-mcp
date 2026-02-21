import "./app.css";
import { baseURL } from "@/baseUrl";
import { AppsSDKUIProvider } from "@openai/apps-sdk-ui/components/AppsSDKUIProvider";
import { NextChatSDKBootstrap } from "@/src/components/shared/next-chat-sdk-bootstrap";
import { ThemeSync } from "@/src/components/theme-sync";
import Link from "next/link";

declare global {
  interface AppsSDKUIConfig {
    LinkComponent: typeof Link;
  }
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NextChatSDKBootstrap baseUrl={baseURL} />
      <AppsSDKUIProvider linkComponent={Link}>
        <ThemeSync />
        {children}
      </AppsSDKUIProvider>
    </>
  );
}
