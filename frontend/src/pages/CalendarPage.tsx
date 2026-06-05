import { AppPageFrame } from "@/pages/page-helpers";
import { Badge, Card } from "@/components/ui/primitives";

const events = [
  { time: "08:30", title: "CPI Zone Euro", impact: "Fort" },
  { time: "14:30", title: "NFP US", impact: "Très fort" },
  { time: "16:00", title: "ISM Services", impact: "Moyen" },
];

export default function CalendarPage() {
  return (
    <AppPageFrame
      title="Calendrier économique"
      description="Vue condensée des rendez-vous macro à surveiller avant vos prises de position."
    >
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.title} className="flex items-center justify-between">
            <div>
              <p className="font-display text-xl text-white">{event.title}</p>
              <p className="text-sm text-slate-400">{event.time}</p>
            </div>
            <Badge>{event.impact}</Badge>
          </Card>
        ))}
      </div>
    </AppPageFrame>
  );
}
