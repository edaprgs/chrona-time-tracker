"use client";

import { BarChart2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import HoursHeatmap from "@/components/HoursHeatmap";
import TaskBreakdown from "@/components/TaskBreakdown";
import MonthlyTrend from "@/components/MonthlyTrend";
import ReportsSummary from "@/components/ReportsSummary";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        icon={BarChart2}
        title="Reports"
        subtitle="Deep-dive into your time and earnings"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* All-time summary cards */}
        <ReportsSummary />

        {/* Heatmap */}
        <HoursHeatmap />

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TaskBreakdown />
          </div>
          <div className="lg:col-span-2">
            <MonthlyTrend />
          </div>
        </div>
      </div>
    </main>
  );
}
