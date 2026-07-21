import { BottomNav } from "@/components/layout/bottom-nav";
import { listNotifications } from "@/lib/data/actions";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notifications = await listNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-shell app-shell-page px-4 pb-28">
      <div data-unread={unread} className="contents">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
