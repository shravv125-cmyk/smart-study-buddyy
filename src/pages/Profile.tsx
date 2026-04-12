import { useAuth } from "@/contexts/AuthContext";
import { useStudy } from "@/contexts/StudyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, BookOpen, Target, TrendingUp, History, CheckCircle2, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user } = useAuth();
  const { plan, allPlans, getProgress, getSubjectProgress, getCompletedTasks, getCompletedPlans, switchPlan } = useStudy();
  const progress = getProgress();
  const completedTasks = getCompletedTasks();
  const completedPlans = getCompletedPlans();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your study overview</p>
      </div>

      {/* User info */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {plan ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">{plan.subjects.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Target className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">{progress.total}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-2xl font-heading font-bold text-foreground">{progress.percentage}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </CardContent>
            </Card>
          </div>

          {/* Subject list */}
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Your Subjects</h2>
            <div className="space-y-2">
              {plan.subjects.map(subject => {
                const sp = getSubjectProgress(subject.id);
                const pct = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;
                return (
                  <div key={subject.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: subject.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{subject.name}</p>
                      <Progress value={pct} className="h-1 mt-1" />
                    </div>
                    <Badge variant="outline" className="text-xs">{pct}%</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Plans Overview */}
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">All Plans</h2>
            {allPlans.length > 0 ? (
              <div className="space-y-2">
                {allPlans.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    {p.status === 'completed' && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                    {p.status === 'active' && <Target className="w-5 h-5 text-primary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{p.subjects.map(s => s.name).join(", ")}</p>
                        <Badge variant={p.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Exam: {format(parseISO(p.examDate), "MMM d, yyyy")}
                        {p.completedAt && ` • Completed: ${format(parseISO(p.completedAt), "MMM d")}`}
                      </p>
                    </div>
                    {p.id !== plan?.id && (
                      <Button size="sm" variant="outline" onClick={() => switchPlan(p.id)}>Switch</Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-muted-foreground text-sm">No plans yet.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {completedPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" /> Completed Plans
              </h2>
              <div className="space-y-2">
                {completedPlans.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/20">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.subjects.map(s => s.name).join(", ")}</p>
                      <p className="text-xs text-muted-foreground">
                        Exam: {format(parseISO(p.examDate), "MMM d, yyyy")} • Completed: {p.completedAt ? format(parseISO(p.completedAt), "MMM d, yyyy") : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study History */}
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Study History
            </h2>
            {completedTasks.length > 0 ? (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.topic}</p>
                      <p className="text-xs text-muted-foreground">{task.subjectName} · {task.duration} min</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(parseISO(task.date), "MMM d")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No completed tasks yet. Start studying!</p>
                </CardContent>
              </Card>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Exam: {format(parseISO(plan.examDate), "MMMM d, yyyy")} · {plan.dailyHours}h/day
          </p>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No study plan yet. Create one from the Planner!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
