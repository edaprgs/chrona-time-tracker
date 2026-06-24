/* src/app/page.tsx */

import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import WeeklyProgress from "@/components/WeeklyProgress";
import DailyChart from "@/components/DailyChart";
import StreakBadge from "@/components/StreakBadge";
import Timer from "@/components/Timer";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <Header />
        <StreakBadge />
      </div>

      <StatCards />

      <div className="grid gap-8 lg:grid-cols-2">
        <DailyChart />
        <WeeklyProgress />
      </div>

      <Timer />
    </main>
  );
}