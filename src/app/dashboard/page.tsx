import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import WeeklyProgress from "@/components/WeeklyProgress";
import DailyChart from "@/components/DailyChart";
import Timer from "@/components/Timer";
import RecentActivity from "@/components/RecentActivity";
import ActivityLog from "@/components/ActivityLog";
import TopTasks from "@/components/TopTasks";
import NotesWidget from "@/components/NotesWidget";
import OvertimeBanner from "@/components/OvertimeBanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-card/60 px-4 py-4 backdrop-blur-sm print:hidden md:px-8 md:py-5">
        <Header />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8 md:space-y-8">
        {/* Overtime alert */}
        <OvertimeBanner />

        {/* Hero — Timer takes the full width top slot */}
        <Timer />

        {/* Stat strip */}
        <StatCards />

        {/* Charts + Top Tasks row */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DailyChart />
          </div>
          <div className="lg:col-span-2">
            <WeeklyProgress />
          </div>
        </div>

        {/* Top Tasks + Recent Activity + Notes */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <TopTasks />
            <NotesWidget />
          </div>
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>
        </div>

        {/* Activity log */}
        <ActivityLog />
      </div>
    </main>
  );
}
