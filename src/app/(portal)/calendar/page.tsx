import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isCoreOrAbove } from "@/lib/roles";
import { getCalendarEvents, CalendarEvent } from "@/lib/google-calendar";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
} from "date-fns";
import { clsx } from "@/lib/clsx";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isCoreOrAbove(session.user.role)) {
    redirect("/");
  }

  const { month } = await searchParams;
  const currentDate = month ? new Date(`${month}-01T00:00:00`) : new Date();
  
  if (isNaN(currentDate.getTime())) {
    redirect("/calendar");
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Fetch events for this calendar view interval
  const events = await getCalendarEvents(
    startDate.toISOString(),
    endDate.toISOString()
  );

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonthStr = format(subMonths(currentDate, 1), "yyyy-MM");
  const nextMonthStr = format(addMonths(currentDate, 1), "yyyy-MM");

  return (
    <div className="space-y-6 animate-slide-up flex flex-col pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Core Calendar</h1>
        </div>
        <div className="flex items-center gap-4 glass rounded-full px-2 py-1 border border-white/10">
          <Link
            href={`/calendar?month=${prevMonthStr}`}
            className="p-2 text-muted hover:text-white transition-colors"
          >
            ←
          </Link>
          <span className="font-medium text-lg w-32 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Link
            href={`/calendar?month=${nextMonthStr}`}
            className="p-2 text-muted hover:text-white transition-colors"
          >
            →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 flex flex-col shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl bg-black/40 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
            <div key={day} className="py-4 text-center text-[11px] font-bold tracking-widest text-muted/80">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div 
          className="grid grid-cols-7 bg-white/5 gap-[1px]"
          style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(140px, auto))` }}
        >
          {days.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayEvents = events.filter((e) => {
              const eStart = e.start.dateTime
                ? new Date(e.start.dateTime)
                : new Date(e.start.date || "");
              
              let eEnd: Date;
              if (e.end.dateTime) {
                eEnd = new Date(e.end.dateTime);
              } else if (e.end.date) {
                eEnd = new Date(e.end.date);
                eEnd = new Date(eEnd.getTime() - 1);
              } else {
                eEnd = eStart;
              }

              return dayStart <= eEnd && dayEnd >= eStart;
            });

            return (
              <div
                key={day.toString()}
                className={clsx(
                  "bg-[#080808]/80 p-2 flex flex-col gap-1.5 transition-colors hover:bg-white/[0.04]",
                  !isSameMonth(day, currentDate) && "opacity-30 grayscale"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={clsx(
                      "text-xs w-7 h-7 flex items-center justify-center rounded-full transition-transform",
                      isToday(day)
                        ? "bg-white text-black font-bold scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                        : "text-muted font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                
                <div className="space-y-1.5 pr-1">
                  {dayEvents.map((event) => {
                    const isAllDay = !event.start.dateTime;
                    const startTime = !isAllDay && event.start.dateTime
                      ? format(new Date(event.start.dateTime), "h:mm a")
                      : "";

                    const eStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
                    let eEnd = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);
                    if (!event.end.dateTime) eEnd = new Date(eEnd.getTime() - 1);

                    const isMultiDay = eStart.toDateString() !== eEnd.toDateString();
                    const isSolid = isAllDay || isMultiDay;
                      
                    const query = new URLSearchParams({
                      title: event.summary || "",
                      start: format(eStart, "yyyy-MM-dd'T'HH:mm"),
                      end: format(eEnd, "yyyy-MM-dd'T'HH:mm")
                    }).toString();

                    return (
                      <Link
                        href={`/coverages/new?${query}`}
                        key={event.id}
                        className={clsx(
                          "block text-[11px] px-2 py-1.5 truncate cursor-pointer transition-all duration-200",
                          isSolid 
                            ? "bg-white text-black font-semibold rounded-md shadow-sm hover:scale-[1.02]"
                            : "bg-white/5 text-white/90 border border-white/5 rounded-md hover:bg-white/10 hover:border-white/15"
                        )}
                        title={event.summary}
                      >
                        {!isSolid && startTime && <span className="font-semibold text-white/50 mr-1.5">{startTime}</span>}
                        <span>{event.summary || "Untitled"}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
