/* src/app/sessions/page.tsx */

"use client";

import { Table2 } from "lucide-react";
import SessionsTable from "@/components/SessionsTable";
import PageHeader from "@/components/PageHeader";

export default function SessionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageHeader icon={Table2} title="Sessions" subtitle="Track your work history" />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:space-y-8 md:px-6 md:py-10">
        <SessionsTable />
      </div>
    </main>
  );
}