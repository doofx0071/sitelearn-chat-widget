import { AdminNavbar } from "@/components/admin-panel/admin-navbar";

interface AdminContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AdminContentLayout({ title, children }: AdminContentLayoutProps) {
  return (
    <div>
      <AdminNavbar title={title} />
      <div className="container pt-8 pb-8 px-4 sm:px-8">{children}</div>
    </div>
  );
}
