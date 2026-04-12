import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { addDays, differenceInDays, format } from "date-fns";

export interface Subject {
  id: string;
  name: string;
  topics: string[];
  difficulty: number; // 1-5
  color: string;
}

export interface StudyTask {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  date: string;
  duration: number; // minutes
  completed: boolean;
  color: string;
}

export interface StudyPlan {
  id: string;
  subjects: Subject[];
  examDate: string;
  dailyHours: number;
  tasks: StudyTask[];
  startDate: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  completedAt?: string;
}

interface StudyContextType {
  plan: StudyPlan | null;
  allPlans: StudyPlan[];
  generatePlan: (subjects: Subject[], examDate: string, dailyHours: number) => void;
  toggleTask: (taskId: string) => void;
  skipDay: (date: string) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  addTopic: (subjectId: string, topic: string) => void;
  getProgress: () => { completed: number; total: number; percentage: number };
  getSubjectProgress: (subjectId: string) => { completed: number; total: number };
  getCompletedTasks: () => StudyTask[];
  switchPlan: (planId: string) => void;
  completePlan: (planId: string) => void;
  deletePlan: (planId: string) => void;
  getCompletedPlans: () => StudyPlan[];
}

const SUBJECT_COLORS = [
  "hsl(217, 72%, 56%)",
  "hsl(168, 50%, 48%)",
  "hsl(38, 92%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(262, 52%, 55%)",
  "hsl(152, 55%, 48%)",
  "hsl(12, 76%, 58%)",
  "hsl(195, 70%, 50%)",
];

const StudyContext = createContext<StudyContextType | null>(null);

export const useStudy = () => {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be within StudyProvider");
  return ctx;
};

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const [allPlans, setAllPlans] = useState<StudyPlan[]>(() => {
    const stored = localStorage.getItem("study-plans");
    return stored ? JSON.parse(stored) : [];
  });

  const [currentPlanId, setCurrentPlanId] = useState<string | null>(() => {
    const stored = localStorage.getItem("current-plan-id");
    return stored;
  });

  const plan = allPlans.find(p => p.id === currentPlanId) || null;

  const savePlans = (plans: StudyPlan[]) => {
    setAllPlans(plans);
    localStorage.setItem("study-plans", JSON.stringify(plans));
  };

  const updateCurrentPlan = (updatedPlan: StudyPlan) => {
    const updated = allPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    savePlans(updated);
  };

  const generatePlan = useCallback((subjects: Subject[], examDate: string, dailyHours: number) => {
    const today = new Date();
    const exam = new Date(examDate);
    const totalDays = Math.max(1, differenceInDays(exam, today));
    const dailyMinutes = dailyHours * 60;

    // Weight by difficulty
    const totalWeight = subjects.reduce((s, sub) => s + sub.difficulty * sub.topics.length, 0);

    const allTasks: StudyTask[] = [];
    let dayIndex = 0;
    let dayMinutesUsed = 0;

    const coloredSubjects = subjects.map((s, i) => ({
      ...s,
      color: s.color || SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    }));

    // Distribute topics across days
    for (const subject of coloredSubjects) {
      const subjectWeight = subject.difficulty * subject.topics.length;
      const subjectMinutes = Math.floor((subjectWeight / totalWeight) * totalDays * dailyMinutes);
      const minutesPerTopic = Math.max(15, Math.floor(subjectMinutes / subject.topics.length));

      for (const topic of subject.topics) {
        if (dayMinutesUsed + minutesPerTopic > dailyMinutes) {
          dayIndex++;
          dayMinutesUsed = 0;
        }
        if (dayIndex >= totalDays) dayIndex = totalDays - 1;

        allTasks.push({
          id: crypto.randomUUID(),
          subjectId: subject.id,
          subjectName: subject.name,
          topic,
          date: format(addDays(today, dayIndex), "yyyy-MM-dd"),
          duration: minutesPerTopic,
          completed: false,
          color: subject.color,
        });
        dayMinutesUsed += minutesPerTopic;
      }
    }

    const newPlan: StudyPlan = {
      id: crypto.randomUUID(),
      subjects: coloredSubjects,
      examDate,
      dailyHours,
      tasks: allTasks,
      startDate: format(today, "yyyy-MM-dd"),
      status: 'active',
      createdAt: format(today, "yyyy-MM-dd HH:mm"),
    };
    
    const updated = [...allPlans, newPlan];
    savePlans(updated);
    setCurrentPlanId(newPlan.id);
    localStorage.setItem("current-plan-id", newPlan.id);
  }, [allPlans]);

  const toggleTask = useCallback((taskId: string) => {
    if (!plan) return;
    const updated = {
      ...plan,
      tasks: plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
    };
    updateCurrentPlan(updated);
  }, [plan, allPlans]);

  const skipDay = useCallback((date: string) => {
    if (!plan) return;
    const skippedTasks = plan.tasks.filter(t => t.date === date && !t.completed);
    if (skippedTasks.length === 0) return;

    const futureDates = [...new Set(plan.tasks.map(t => t.date).filter(d => d > date))].sort();
    if (futureDates.length === 0) return;

    let redistIndex = 0;
    const updatedTasks = plan.tasks.map(t => {
      if (t.date === date && !t.completed) {
        const newDate = futureDates[redistIndex % futureDates.length];
        redistIndex++;
        return { ...t, date: newDate };
      }
      return t;
    });

    updateCurrentPlan({ ...plan, tasks: updatedTasks });
  }, [plan, allPlans]);

  const updateSubject = useCallback((subject: Subject) => {
    if (!plan) return;
    const updatedSubjects = plan.subjects.map(s => s.id === subject.id ? subject : s);
    updateCurrentPlan({ ...plan, subjects: updatedSubjects });
  }, [plan, allPlans]);

  const deleteSubject = useCallback((subjectId: string) => {
    if (!plan) return;
    updateCurrentPlan({
      ...plan,
      subjects: plan.subjects.filter(s => s.id !== subjectId),
      tasks: plan.tasks.filter(t => t.subjectId !== subjectId),
    });
  }, [plan, allPlans]);

  const getProgress = useCallback(() => {
    if (!plan) return { completed: 0, total: 0, percentage: 0 };
    const total = plan.tasks.length;
    const completed = plan.tasks.filter(t => t.completed).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [plan]);

  const getSubjectProgress = useCallback((subjectId: string) => {
    if (!plan) return { completed: 0, total: 0 };
    const tasks = plan.tasks.filter(t => t.subjectId === subjectId);
    return { completed: tasks.filter(t => t.completed).length, total: tasks.length };
  }, [plan]);

  const addTopic = useCallback((subjectId: string, topic: string) => {
    if (!plan) return;
    const subject = plan.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedSubjects = plan.subjects.map(s =>
      s.id === subjectId ? { ...s, topics: [...s.topics, topic] } : s
    );

    const dates = [...new Set(plan.tasks.map(t => t.date))].sort();
    const targetDate = dates[dates.length - 1] || format(new Date(), "yyyy-MM-dd");

    const newTask: StudyTask = {
      id: crypto.randomUUID(),
      subjectId,
      subjectName: subject.name,
      topic,
      date: targetDate,
      duration: 30,
      completed: false,
      color: subject.color,
    };

    updateCurrentPlan({ ...plan, subjects: updatedSubjects, tasks: [...plan.tasks, newTask] });
  }, [plan, allPlans]);

  const getCompletedTasks = useCallback(() => {
    if (!plan) return [];
    return plan.tasks.filter(t => t.completed).sort((a, b) => b.date.localeCompare(a.date));
  }, [plan]);

  const switchPlan = useCallback((planId: string) => {
    if (allPlans.find(p => p.id === planId)) {
      setCurrentPlanId(planId);
      localStorage.setItem("current-plan-id", planId);
    }
  }, [allPlans]);

  const completePlan = useCallback((planId: string) => {
    const planToComplete = allPlans.find(p => p.id === planId);
    if (!planToComplete) return;
    
    const updated = allPlans.map(p => 
      p.id === planId 
        ? { ...p, status: 'completed' as const, completedAt: format(new Date(), "yyyy-MM-dd HH:mm") }
        : p
    );
    savePlans(updated);
  }, [allPlans]);

  const deletePlan = useCallback((planId: string) => {
    const updated = allPlans.filter(p => p.id !== planId);
    savePlans(updated);
    if (currentPlanId === planId) {
      const nextPlan = updated.find(p => p.status === 'active') || updated[0];
      if (nextPlan) {
        setCurrentPlanId(nextPlan.id);
        localStorage.setItem("current-plan-id", nextPlan.id);
      } else {
        setCurrentPlanId(null);
        localStorage.removeItem("current-plan-id");
      }
    }
  }, [allPlans, currentPlanId]);

  const getCompletedPlans = useCallback(() => {
    return allPlans.filter(p => p.status === 'completed').sort((a, b) => 
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    );
  }, [allPlans]);

  return (
    <StudyContext.Provider value={{ 
      plan, 
      allPlans,
      generatePlan, 
      toggleTask, 
      skipDay, 
      updateSubject, 
      deleteSubject, 
      addTopic, 
      getProgress, 
      getSubjectProgress, 
      getCompletedTasks,
      switchPlan,
      completePlan,
      deletePlan,
      getCompletedPlans,
    }}>
      {children}
    </StudyContext.Provider>
  );
};
