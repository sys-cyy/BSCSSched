import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { type Class } from "@shared/schema";

interface ClassCardProps {
  classItem: Class;
  isAdmin?: boolean;
  onEdit?: (classItem: Class) => void;
  onDelete?: (classItem: Class) => void;
}

export function ClassCard({ classItem, isAdmin = false, onEdit, onDelete }: ClassCardProps) {
  // Extract course number from course name if it exists (e.g., "#494 - CS 2104")
  const courseMatch = classItem.course.match(/#(\d+)/);
  const courseNumber = courseMatch ? courseMatch[1] : null;
  const courseName = classItem.course.replace(/#\d+\s*-\s*/, "");

  return (
    <Card className="hover-elevate transition-all duration-200 hover:shadow-lg group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {courseNumber && (
              <Badge 
                variant="secondary" 
                className="mb-2 uppercase text-xs font-mono"
                data-testid={`badge-course-${classItem.id}`}
              >
                #{courseNumber}
              </Badge>
            )}
            <h3 
              className="text-lg font-medium text-card-foreground leading-tight"
              data-testid={`text-course-name-${classItem.id}`}
            >
              {courseName}
            </h3>
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit?.(classItem)}
                data-testid={`button-edit-${classItem.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete?.(classItem)}
                data-testid={`button-delete-${classItem.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-medium" data-testid={`text-time-${classItem.id}`}>
            {classItem.time}
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full"
          asChild
          data-testid={`button-join-${classItem.id}`}
        >
          <a 
            href={classItem.link.startsWith('http') ? classItem.link : `https://${classItem.link}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Join Class
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
