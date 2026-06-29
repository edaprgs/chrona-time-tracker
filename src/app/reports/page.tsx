import { BarChart2 } from "lucide-react";
import HoursHeatmap from "@/components/HoursHeatmap";
import TaskBreakdown from "@/components/TaskBreakdown";
import MonthlyTrend from "@/components/MonthlyTrend";
import ReportsSummary from "@/components/ReportsSummary";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b bg-card/60 px-4 py-4 backdrop-blur-sm md:px-8 md:py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <BarChart2 className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Reports</h1>
            <p className="text-sm text-muted-foreground">Deep-dive into your time and earnings</p>
          </div>
        </div>
      </div>

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
