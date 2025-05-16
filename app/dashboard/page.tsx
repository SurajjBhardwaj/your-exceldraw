import { DrawingList } from "@/components/drawing-list";
import { UserStats } from "@/components/user-stats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Change this to use the default NextAuth sign-in page
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your drawings and account settings
          </p>
        </div>
        <Button asChild>
          <Link href="/editor/new">New Drawing</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UserStats />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Drawings</h2>
        <DrawingList />
      </div>
    </div>
  );
}
