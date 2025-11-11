import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DAYS_OF_WEEK, type Class } from "@shared/schema";
import { Zap, Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function ForceAnnounce() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState<"class" | "custom">("class");

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const filteredClasses = selectedDay 
    ? classes.filter(c => c.day === selectedDay)
    : [];

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const announceMutation = useMutation({
    mutationFn: async (data: { classId?: string; customMessage?: string }) => {
      return await apiRequest("POST", "/api/announce", data);
    },
    onSuccess: () => {
      toast({
        title: "Announcement Sent!",
        description: "The announcement has been sent to Discord successfully.",
      });
      setSelectedDay("");
      setSelectedClassId("");
      setCustomMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendAnnouncement = () => {
    if (announcementType === "class" && !selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class to announce.",
        variant: "destructive",
      });
      return;
    }

    if (announcementType === "custom" && !customMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom message.",
        variant: "destructive",
      });
      return;
    }

    announceMutation.mutate({
      classId: announcementType === "class" ? selectedClassId : undefined,
      customMessage: announcementType === "custom" ? customMessage : undefined,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Force Announce</h1>
        <p className="text-muted-foreground mt-1">
          Manually trigger a class announcement to Discord
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-chart-3/50 bg-chart-3/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-chart-3" />
            <CardTitle className="text-base">Important Notice</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This will immediately send an announcement to your Discord channel. Make sure you've selected the correct class or written the right message before sending.
          </p>
        </CardContent>
      </Card>

      {/* Announcement Type Selector */}
      <div className="space-y-2">
        <Label>Announcement Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={announcementType === "class" ? "default" : "outline"}
            onClick={() => setAnnouncementType("class")}
            className="justify-start"
            data-testid="button-type-class"
          >
            <Zap className="h-4 w-4 mr-2" />
            Announce Class
          </Button>
          <Button
            variant={announcementType === "custom" ? "default" : "outline"}
            onClick={() => setAnnouncementType("custom")}
            className="justify-start"
            data-testid="button-type-custom"
          >
            <Send className="h-4 w-4 mr-2" />
            Custom Message
          </Button>
        </div>
      </div>

      {/* Class Announcement Form */}
      {announcementType === "class" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="day">Select Day</Label>
            <Select value={selectedDay} onValueChange={(value) => {
              setSelectedDay(value);
              setSelectedClassId("");
            }}>
              <SelectTrigger data-testid="select-announce-day">
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDay && (
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger data-testid="select-announce-class">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.time} - {classItem.course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedClass && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>How the announcement will appear in Discord</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-primary">Class Reminder</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Course:</strong> {selectedClass.course}</p>
                      <p><strong>Time:</strong> {selectedClass.time}</p>
                      <p><strong>Day:</strong> {selectedClass.day}</p>
                      <p><strong>Link:</strong> {selectedClass.link}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Custom Message Form */}
      {announcementType === "custom" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message</Label>
            <Textarea
              id="custom-message"
              placeholder="Enter your announcement message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              data-testid="input-custom-message"
            />
          </div>

          {customMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>How the announcement will appear in Discord</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-primary">Announcement</h3>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{customMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={handleSendAnnouncement}
          disabled={
            announceMutation.isPending ||
            (announcementType === "class" && !selectedClassId) ||
            (announcementType === "custom" && !customMessage.trim())
          }
          data-testid="button-send-announcement"
        >
          {announceMutation.isPending ? (
            <>Sending...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Announcement
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
