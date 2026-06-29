import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import WeeklyProgress from "@/components/WeeklyProgress";
import DailyChart from "@/components/DailyChart";
import Timer from "@/components/Timer";
import RecentActivity from "@/components/RecentActivity";
import ActivityLog from "@/components/ActivityLog";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card/60 px-8 py-5 backdrop-blur-sm print:hidden">
        <Header />
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-8 py-8">
        {/* Hero — Timer takes the full width top slot */}
        <Timer />

        {/* Stat strip */}
        <StatCards />

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DailyChart />
          </div>
          <div className="lg:col-span-2">
            <WeeklyProgress />
          </div>
        </div>

        {/* Session history */}
        <RecentActivity />

        {/* Activity log */}
        <ActivityLog />
      </div>
    </main>
  );
}
