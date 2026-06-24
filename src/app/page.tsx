/* src/app/page.tsx */

import Header from "@/components/Header";
import StatCards from "@/components/StatCards";
import WeeklyProgress from "@/components/WeeklyProgress";
import Timer from "@/components/Timer";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <Header />

      <StatCards />

      <Timer />

      <WeeklyProgress />
    </main>
  );
}