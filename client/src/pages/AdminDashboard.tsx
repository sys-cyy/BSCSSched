import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassCard } from "@/components/ClassCard";
import { AddClassDialog } from "@/components/AddClassDialog";
import { EditClassDialog } from "@/components/EditClassDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { DAYS_OF_WEEK, type Class } from "@shared/schema";
import { Calendar, Plus, Zap, BookOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

export function AdminDashboard() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Get today's classes
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = classes.filter(c => c.day === today).sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`);
    const timeB = new Date(`2000-01-01 ${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  // Get upcoming classes (next 3 days)
  const dayIndex = DAYS_OF_WEEK.indexOf(today as any);
  const nextDays = [...DAYS_OF_WEEK.slice(dayIndex), ...DAYS_OF_WEEK.slice(0, dayIndex)].slice(0, 3);
  const upcomingClasses = classes
    .filter(c => nextDays.includes(c.day as any))
    .sort((a, b) => {
      const dayDiff = nextDays.indexOf(a.day as any) - nextDays.indexOf(b.day as any);
      if (dayDiff !== 0) return dayDiff;
      const timeA = new Date(`2000-01-01 ${a.time}`);
      const timeB = new Date(`2000-01-01 ${b.time}`);
      return timeA.getTime() - timeB.getTime();
    })
    .slice(0, 3);

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your class schedule</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-class">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
          <Button variant="outline" asChild data-testid="button-force-announce">
            <Link href="/admin/announce">
              <Zap className="h-4 w-4 mr-2" />
              Force Announce
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-classes">{classes.length}</div>
            <p className="text-xs text-muted-foreground">Across all days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-today-classes">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">{today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-days">
              {new Set(classes.map(c => c.day)).size}
            </div>
            <p className="text-xs text-muted-foreground">Days with classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Today's Schedule</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : todayClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No classes scheduled for today</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todayClasses.map((classItem) => (
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

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Classes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingClasses.map((classItem) => (
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
