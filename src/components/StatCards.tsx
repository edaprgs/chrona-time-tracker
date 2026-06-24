/* src/components/StatCards.tsx */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useStats } from "@/hooks/useStats";
import {
  CalendarDays,
  CalendarRange,
  History,
  Target,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

type StatKey =
  | "todayHours"
  | "weeklyHours"
  | "biweeklyHours"
  | "remainingHours"
  | "weeklyEarnings";

interface StatCard {
  key: StatKey;
  label: string;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  accent?: boolean;
}

const cards: StatCard[] = [
  { key: "todayHours", label: "Today", icon: CalendarDays, suffix: "h" },
  { key: "weeklyHours", label: "This Week", icon: CalendarRange, suffix: "h" },
  { key: "biweeklyHours", label: "Last 14 Days", icon: History, suffix: "h" },
  {
    key: "remainingHours",
    label: "Remaining (40h cap)",
    icon: Target,
    suffix: "h",
    accent: true,
  },
  {
    key: "weeklyEarnings",
    label: "Earnings This Week",
    icon: DollarSign,
    prefix: "$",
    accent: true,
  },
];

export default function StatCards() {
  const stats = useStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, prefix, suffix, accent }) => (
        <Card key={key} className="border-border/60">
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-muted-foreground">{label}</h3>
              <Icon
                className={accent ? "size-4 text-primary" : "size-4 text-muted-foreground"}
              />
            </div>

            <h2 className={accent ? "text-3xl font-bold text-primary" : "text-3xl font-bold"}>
              {prefix}
              {stats[key]}
              {suffix}
            </h2>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}