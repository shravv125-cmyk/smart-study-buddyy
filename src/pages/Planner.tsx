import { useState } from "react";
import { useStudy, Subject } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, CalendarDays, Clock, SkipForward, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";

const Planner = () => {
  const { plan, allPlans, generatePlan, toggleTask, skipDay, addTopic, switchPlan } = useStudy();
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [creatingNewPlan, setCreatingNewPlan] = useState(!plan);
  const [subjects, setSubjects] = useState<{ name: string; topics: string; difficulty: number }[]>([
    { name: "", topics: "", difficulty: 3 },
  ]);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(4);

  const addSubject = () => setSubjects([...subjects, { name: "", topics: "", difficulty: 3 }]);
  const removeSubject = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));

  const handleGenerate = () => {
    const validSubjects: Subject[] = subjects
      .filter(s => s.name.trim() && s.topics.trim())
      .map(s => ({
        id: crypto.randomUUID(),
        name: s.name.trim(),
        topics: s.topics.split(",").map(t => t.trim()).filter(Boolean),
        difficulty: s.difficulty,
        color: "",
      }));

    if (validSubjects.length === 0 || !examDate) return;
    generatePlan(validSubjects, examDate, dailyHours);
    
    // Reset form and stop creating new plan
    setSubjects([{ name: "", topics: "", difficulty: 3 }]);
    setExamDate("");
    setDailyHours(4);
    setCreatingNewPlan(false);
  };

  // Group tasks by date
  const tasksByDate = plan?.tasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {} as Record<string, typeof plan.tasks>) || {};

  const sortedDates = Object.keys(tasksByDate).sort();
  const today = format(new Date(), "yyyy-MM-dd");

  if (!plan || creatingNewPlan) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Your Study Plan</h1>
          <p className="text-muted-foreground">Add your subjects, set your exam date, and let AI generate a smart schedule.</p>
        </div>

        {/* Show previous plans if any */}
        {allPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Previous Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allPlans.map(p => (
                <Button
                  key={p.id}
                  variant="outline"
                  onClick={() => switchPlan(p.id)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <div className="flex-1">
                    <div className="font-medium">{p.subjects.map(s => s.name).join(", ")}</div>
                    <div className="text-xs text-muted-foreground">
                      Exam: {format(parseISO(p.examDate), "MMM d, yyyy")} · {p.status}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Sparkles className="w-5 h-5 text-primary" /> Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map((s, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Subject {i + 1}</span>
                  {subjects.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="h-7 w-7">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Subject name (e.g., Mathematics)"
                  value={s.name}
                  onChange={e => {
                    const copy = [...subjects];
                    copy[i].name = e.target.value;
                    setSubjects(copy);
                  }}
                />
                <Input
                  placeholder="Topics (comma-separated, e.g., Algebra, Geometry, Calculus)"
                  value={s.topics}
                  onChange={e => {
                    const copy = [...subjects];
                    copy[i].topics = e.target.value;
                    setSubjects(copy);
                  }}
                />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Difficulty: {s.difficulty}/5</Label>
                  <input
                    type="range" min={1} max={5} value={s.difficulty}
                    onChange={e => {
                      const copy = [...subjects];
                      copy[i].difficulty = Number(e.target.value);
                      setSubjects(copy);
                    }}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addSubject} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" /> Exam Date
                </Label>
                <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Daily Hours
                </Label>
                <Input type="number" min={1} max={16} value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} />
              </div>
            </div>
            <Button onClick={handleGenerate} className="w-full" size="lg">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Smart Schedule
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Your Study Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {plan.subjects.length} subjects · Exam on {format(parseISO(plan.examDate), "MMM d, yyyy")}
          </p>
        </div>
        <Button variant="outline" onClick={() => setCreatingNewPlan(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Another Plan
        </Button>
      </div>

      {/* Show other plans if any */}
      {allPlans.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-heading">Switch Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              {allPlans.map(p => (
                <Button
                  key={p.id}
                  variant={p.id === plan.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchPlan(p.id)}
                >
                  {p.subjects.slice(0, 2).map(s => s.name).join(", ")}
                  {p.subjects.length > 2 && "..."}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Topic Section */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-heading font-semibold text-foreground mb-2">Add a Topic</p>
          <div className="flex items-center gap-2 flex-wrap">
            {plan.subjects.map(s => (
              <Badge
                key={s.id}
                variant={addingTopicFor === s.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => { setAddingTopicFor(addingTopicFor === s.id ? null : s.id); setNewTopic(""); }}
              >
                <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: s.color }} />
                {s.name}
              </Badge>
            ))}
          </div>
          {addingTopicFor && (
            <div className="flex items-center gap-2 mt-3">
              <Input
                placeholder="New topic name"
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newTopic.trim()) {
                    addTopic(addingTopicFor, newTopic.trim());
                    setNewTopic("");
                    setAddingTopicFor(null);
                  }
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sortedDates.map(date => {
          const tasks = tasksByDate[date];
          const isToday = date === today;
          const allDone = tasks.every(t => t.completed);

          return (
            <Card key={date} className={`transition-all ${isToday ? "ring-2 ring-primary/30 shadow-md" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-heading">
                      {format(parseISO(date), "EEEE, MMM d")}
                    </CardTitle>
                    {isToday && <Badge className="bg-primary/10 text-primary border-0 text-xs">Today</Badge>}
                    {allDone && <Badge className="bg-success/10 text-success border-0 text-xs">Done ✓</Badge>}
                  </div>
                  {!allDone && (
                    <Button variant="ghost" size="sm" onClick={() => skipDay(date)} className="text-muted-foreground text-xs">
                      <SkipForward className="w-3 h-3 mr-1" /> Skip Day
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      task.completed ? "bg-muted/50 opacity-60" : "bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: task.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.subjectName} · {task.duration} min</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Planner;
