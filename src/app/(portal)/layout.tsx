import { auth } from "@/auth";
import { TopNav } from "@/components/topnav";
import { Sidebar } from "@/components/sidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Persistent Jira-style Sidebar */}
      <Sidebar user={session.user} />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav user={session.user} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <div className="mx-auto w-full max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
