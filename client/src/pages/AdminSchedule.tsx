import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/ClassCard";
import { AddClassDialog } from "@/components/AddClassDialog";
import { EditClassDialog } from "@/components/EditClassDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { DAYS_OF_WEEK, type Class } from "@shared/schema";
import { Plus, Loader2, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function AdminSchedule() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Group classes by day
  const classesByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = classes.filter(c => c.day === day).sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    });
    return acc;
  }, {} as Record<string, Class[]>);

  // Get current day
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const handleAddClass = async (classData: { day: string; time: string; course: string; link: string }) => {
    try {
      await apiRequest("POST", "/api/classes", classData);
      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add class",
        variant: "destructive",
      });
    }
  };

  const handleEditClass = async (id: string, classData: { day: string; time: string; course: string; link: string }) => {
    try {
      await apiRequest("PATCH", `/api/classes/${id}`, classData);
      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setEditDialogOpen(false);
      setSelectedClass(null);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      await apiRequest("DELETE", `/api/classes/${selectedClass.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Full Schedule</h1>
          <p className="text-muted-foreground mt-1">View and manage all classes</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-class-schedule">
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Schedule Grid */}
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
            Get started by adding your first class to the schedule.
          </p>
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-first-class">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Class
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Desktop: Grid View */}
          <div className="hidden lg:grid lg:grid-cols-7 gap-4">
            {DAYS_OF_WEEK.slice(0, 7).map((day) => (
              <div key={day} className="space-y-4">
                <div className={`sticky top-0 z-10 pb-3 bg-background ${day === currentDay ? 'text-primary' : ''}`}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
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
                    <ClassCard
                      key={classItem.id}
                      classItem={classItem}
                      isAdmin
                      onEdit={(c) => {
                        setSelectedClass(c);
                        setEditDialogOpen(true);
                      }}
                      onDelete={(c) => {
                        setSelectedClass(c);
                        setDeleteDialogOpen(true);
                      }}
                    />
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
                      <ClassCard
                        key={classItem.id}
                        classItem={classItem}
                        isAdmin
                        onEdit={(c) => {
                          setSelectedClass(c);
                          setEditDialogOpen(true);
                        }}
                        onDelete={(c) => {
                          setSelectedClass(c);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddClassDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddClass}
      />
      <EditClassDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        classItem={selectedClass}
        onUpdate={handleEditClass}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        classItem={selectedClass}
        onConfirm={handleDeleteClass}
      />
    </div>
  );
}
