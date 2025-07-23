import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
