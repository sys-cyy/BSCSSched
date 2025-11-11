import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/ClassCard";
import { DAYS_OF_WEEK, type Class } from "@shared/schema";
import { Calendar, LogIn, Moon, Sun, Loader2, Eye } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { io } from "socket.io-client";

interface PublicScheduleProps {
  onAdminLogin: () => void;
}

export function PublicSchedule({ onAdminLogin }: PublicScheduleProps) {
  const { theme, setTheme } = useTheme();
  const [viewerCount, setViewerCount] = useState(0);


  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || "https://your-railway-backend-url");

    socket.emit("viewer-joined");

    socket.on("viewer-count-update", (count: number) => {
      setViewerCount(count);
    });

    return () => {
      socket.emit("viewer-left");
      socket.disconnect();
    };
  }, []);

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = classes.filter(c => c.day === day).sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });
    return acc;
  }, {} as Record<string, Class[]>);

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Class Notifier</h1>
                <p className="text-xs text-muted-foreground">Weekly Schedule</p>

                {/* 👀 Real-Time Viewer Counter */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Eye className="h-3 w-3" />
                  <span>{viewerCount} viewing now</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle-public"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button onClick={onAdminLogin} data-testid="button-admin-login-header">
                <LogIn className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Classes Scheduled</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              There are no classes in the schedule yet. Contact your admin to add classes.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Desktop: Grid View */}
            <div className="hidden lg:grid lg:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.slice(0, 7).map((day) => (
                <div key={day} className="space-y-4">
                  <div className={`sticky top-20 z-10 pb-3 bg-background ${day === currentDay ? 'text-primary' : ''}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide" data-testid={`text-day-${day}`}>
                      {day}
                    </h3>
                    {classesByDay[day].length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {classesByDay[day].length} {classesByDay[day].length === 1 ? 'class' : 'classes'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {classesByDay[day].map((classItem) => (
                      <ClassCard key={classItem.id} classItem={classItem} />
                    ))}
                    {classesByDay[day].length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No classes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile/Tablet: List View */}
            <div className="lg:hidden space-y-6">
              {DAYS_OF_WEEK.slice(0, 7).map((day) => (
                <div key={day} className="space-y-3">
                  <h3 className={`text-lg font-semibold ${day === currentDay ? 'text-primary' : ''}`}>
                    {day}
                    {classesByDay[day].length > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground font-normal">
                        ({classesByDay[day].length})
                      </span>
                    )}
                  </h3>
                  {classesByDay[day].length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-4">No classes scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {classesByDay[day].map((classItem) => (
                        <ClassCard key={classItem.id} classItem={classItem} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
