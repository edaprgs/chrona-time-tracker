"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Coffee, Users, Phone, Zap, Toilet, Car, Heart, BookOpen, Dumbbell, Baby, ShoppingCart, MonitorOff } from "lucide-react";

const QUICK_REASONS = [
  { label: "Lunch / Food",   icon: Coffee     },
  { label: "Meeting",        icon: Users      },
  { label: "Phone call",     icon: Phone      },
  { label: "Distraction",    icon: Zap        },
  { label: "Restroom",       icon: Toilet     },
  { label: "Commute / Errand", icon: Car      },
  { label: "Health / Rest",  icon: Heart      },
  { label: "Study / Reading",icon: BookOpen   },
  { label: "Exercise",       icon: Dumbbell   },
  { label: "Family / Kids",  icon: Baby       },
  { label: "Errands / Chores", icon: ShoppingCart },
  { label: "Screen break",   icon: MonitorOff },
];

interface Props {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function PauseReasonDialog({ open, onConfirm, onCancel }: Props) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");

  function handleConfirm() {
    const reason = custom.trim() || selected;
    onConfirm(reason);
    setSelected("");
    setCustom("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Why are you pausing?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_REASONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { setSelected(label); setCustom(""); }}
                className={
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors " +
                  (selected === label && !custom
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted")
                }
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Or describe why… (optional)"
            rows={2}
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setSelected(""); }}
          />

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Pause
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
