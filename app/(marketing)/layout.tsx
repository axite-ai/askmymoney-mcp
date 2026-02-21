import "./marketing.css";
import { Nav, SiteFooter } from "./components";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-surface text-default overflow-x-hidden min-h-screen">
      <Nav />
      {children}
      <SiteFooter />
    </div>
  );
}
