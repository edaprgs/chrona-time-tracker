/* src/app/sessions/page.tsx */

import SessionsTable from "@/components/SessionsTable";

export default function SessionsPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10">
      <div>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">Track your work history</p>
      </div>

      <SessionsTable />
    </main>
  );
}