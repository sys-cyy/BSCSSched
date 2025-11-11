import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAYS_OF_WEEK, type Class } from "@shared/schema";
import { Pencil } from "lucide-react";

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: Class | null;
  onUpdate: (id: string, classData: { day: string; time: string; course: string; link: string }) => void;
}

export function EditClassDialog({ open, onOpenChange, classItem, onUpdate }: EditClassDialogProps) {
  const [day, setDay] = useState("Monday");
  const [hour, setHour] = useState("01");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");
  const [course, setCourse] = useState("");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  useEffect(() => {
    if (classItem) {
      setDay(classItem.day);
      setCourse(classItem.course);
      setLink(classItem.link);
      
      // Parse time (e.g., "10:00 AM")
      const timeMatch = classItem.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        setHour(timeMatch[1].padStart(2, "0"));
        setMinute(timeMatch[2].padStart(2, "0"));
        setPeriod(timeMatch[3].toUpperCase());
      }
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem || !course || !link) return;

    setIsLoading(true);
    const time = `${hour}:${minute} ${period}`;
    await onUpdate(classItem.id, { day, time, course, link });
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Pencil className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Edit Class</DialogTitle>
          <DialogDescription className="text-center">
            Update class details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-day">Day of Week</Label>
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger data-testid="select-edit-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <div className="flex gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="w-20" data-testid="select-edit-hour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="w-20" data-testid="select-edit-minute">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-20" data-testid="select-edit-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-course">Course Name</Label>
            <Input
              id="edit-course"
              placeholder="e.g., #494 - CS 2104 (Introduction to Data Science)"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              data-testid="input-edit-course"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-link">Google Meet Link</Label>
            <Input
              id="edit-link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              data-testid="input-edit-link"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !course || !link} data-testid="button-save-class">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
