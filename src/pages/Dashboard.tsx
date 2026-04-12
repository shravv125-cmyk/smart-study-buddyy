import { useStudy } from "@/contexts/StudyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, BookOpen, CheckCircle, Edit2, Save, X, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const { plan, allPlans, getProgress, getSubjectProgress, updateSubject, getCompletedPlans, switchPlan, completePlan } = useStudy();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const progress = getProgress();
  const completedPlans = getCompletedPlans();

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-heading font-semibold text-foreground">No Study Plan Yet</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Create a study plan from the Planner page to see your dashboard.
        </p>
      </div>
    );
  }

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const subject = plan.subjects.find(s => s.id === editingId);
    if (subject) {
      updateSubject({ ...subject, name: editName });
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your progress and manage subjects</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-heading font-semibold text-foreground">Overall Progress</span>
            </div>
            <span className="text-2xl font-heading font-bold text-primary">{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {progress.completed} of {progress.total} tasks completed · Exam on {format(parseISO(plan.examDate), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>

      {/* Subjects */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Subjects</h2>
        <div className="space-y-3">
          {plan.subjects.map(subject => {
            const sp = getSubjectProgress(subject.id);
            const pct = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;
            const isEditing = editingId === subject.id;

            return (
              <Card key={subject.id}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-sm" />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit}>
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{subject.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(subject.id, subject.name)}>
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{sp.completed}/{sp.total}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {subject.topics.length} topics
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mark Plan as Completed */}
      {plan && plan.status === 'active' && progress.percentage === 100 && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">All tasks completed!</p>
                  <p className="text-sm text-muted-foreground">Mark this plan as completed?</p>
                </div>
              </div>
              <Button onClick={() => completePlan(plan.id)} className="bg-success hover:bg-success/90">
                Complete Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Plans Overview */}
      {allPlans.length > 1 && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3">All Plans</h2>
          <div className="space-y-2">
            {allPlans.map(p => (
              <Card key={p.id} className={p.id === plan?.id ? 'border-primary/50 bg-primary/5' : ''}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{p.subjects.map(s => s.name).join(", ")}</p>
                      <Badge variant={p.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                        {p.status}
                      </Badge>
                      {p.id === plan?.id && <Badge className="text-xs bg-primary">Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Exam: {format(parseISO(p.examDate), "MMM d, yyyy")}</p>
                  </div>
                  {p.id !== plan?.id && (
                    <Button size="sm" variant="outline" onClick={() => switchPlan(p.id)}>
                      Switch
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Plans */}
      {completedPlans.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" /> Completed Plans ({completedPlans.length})
          </h2>
          <div className="space-y-2">
            {completedPlans.map(p => (
              <Card key={p.id} className="bg-success/5 border-success/20">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{p.subjects.map(s => s.name).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">
                        Exam: {format(parseISO(p.examDate), "MMM d, yyyy")} {p.completedAt && `• Completed: ${format(parseISO(p.completedAt), "MMM d")}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
