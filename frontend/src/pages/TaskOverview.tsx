import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SURVEY_STATE_STORAGE_KEY } from "@/lib/config";

interface MainTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  priority: "urgent" | "important" | "when-ready";
}

const mainTasks: MainTask[] = [
  {
    id: "register_death",
    title: "Register the Death",
    description: "This is one of the first essential steps. You'll need to register the death within 5 days.",
    icon: "📋",
    estimatedTime: "1-2 hours",
    priority: "urgent"
  },
  {
    id: "arrange_funeral",
    title: "Arrange the Funeral",
    description: "Take your time with this. There's no rush, and you can arrange something that feels right.",
    icon: "🕊️",
    estimatedTime: "Several days",
    priority: "important"
  },
  {
    id: "legal_financial",
    title: "Handle Legal and Financial Matters",
    description: "We'll guide you through finding the will, contacting banks, and applying for probate.",
    icon: "⚖️",
    estimatedTime: "Ongoing",
    priority: "important"
  },
  {
    id: "notify_organizations",
    title: "Notify Organizations and Services",
    description: "Let relevant organizations know about the death to close accounts and stop correspondence.",
    icon: "📧",
    estimatedTime: "2-3 hours",
    priority: "important"
  },
  {
    id: "digital_legacy",
    title: "Handle Digital Legacy",
    description: "Manage social media accounts, email, and preserve precious digital memories.",
    icon: "💻",
    estimatedTime: "1-2 hours",
    priority: "when-ready"
  }
];

const TaskOverview = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<number | null>(null);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  const handleStartGuide = useCallback(() => {
    navigate("/procedure");
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate("/complete");
  }, [navigate]);

  useEffect(() => {
    const normalize = (s: string) => (s || "").trim().toLowerCase();

    const bootstrap = async () => {
      try {
        const raw = localStorage.getItem(SURVEY_STATE_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const answers = parsed.answers || {};

        // First, try to get a generated checklist from backend (preferred)
        let checklist: any = null;
        try {
          const res = await fetch("/checklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
          });
          if (res.ok) {
            const json = await res.json();
            checklist = json.checklist;
            const prog = checklist?.meta?.progress;
            if (typeof prog === "number") setProgress(prog);
          }
        } catch (err) {
          console.warn("Failed to fetch checklist for overview:", err);
        }

        // If we received a checklist, use it to compute completed titles.
        if (checklist) {
          const completed = new Set<string>();
          (checklist?.steps || []).forEach((step: any) => {
            if (step.completed) completed.add(step.title);
            (step.substeps || []).forEach((sub: any) => {
              if (sub.completed) completed.add(sub.title);
            });
          });
          setCompletedSet(completed);
          return;
        }

        // Fallback: compute completion from survey answers directly.
        // We treat items present in todo_list as "pending" and items not present as completed.
        const raw_todo = answers.todo_list || answers.todos || [];
        const todoSet = new Set<string>(
          Array.isArray(raw_todo) ? raw_todo.map((t: string) => normalize(t)) : []
        );

        const completed = new Set<string>();
        mainTasks.forEach((task) => {
          const tnorm = normalize(task.title);
          // if the task title appears in the user's todo list -> pending (not completed)
          if (!todoSet.has(tnorm)) {
            completed.add(task.title);
          }
        });
        setCompletedSet(completed);
      } catch (err) {
        console.warn("Failed to initialise overview state:", err);
      }
    };

    bootstrap();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-50 border-red-200 text-red-700";
      case "important":
        return "bg-amber-50 border-amber-200 text-amber-700";
      case "when-ready":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Time Sensitive";
      case "important":
        return "Important";
      case "when-ready":
        return "When You're Ready";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
        style={{
          background: 'linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Your Gentle Guide
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
              Based on what you've shared with us, here are the main tasks ahead. 
              Don't worry—we'll take you through each one, step by step.
            </p>
          </div>

          {/* Progress */}
          {progress !== null && (
            <div className="mb-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Overview progress</div>
              <div className="w-full bg-gray-200 rounded-full h-3 max-w-2xl mx-auto">
                <div className="h-3 bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-sm text-muted-foreground mt-2">{progress}% complete</div>
            </div>
          )}

          {/* Main Tasks Grid */}
          <div className="space-y-6 mb-12">
            {mainTasks.map((task, index) => (
              <div
                key={task.id}
                className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start gap-6">
                    {/* Task Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl md:text-4xl">
                        {task.icon}
                      </div>
                      <div className="text-center mt-2 text-sm font-semibold text-muted-foreground">
                        Step {index + 1}
                      </div>
                    </div>

                    {/* Task Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                          {task.title}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      
                      <p className={`text-base md:text-lg leading-relaxed mb-3 ${completedSet.has(task.title) ? 'text-foreground/50 line-through' : 'text-foreground/70'}`}>
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Estimated time: {task.estimatedTime}</span>
                        {completedSet.has(task.title) && (
                          <span className="ml-3 inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-100">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Information Box */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-2xl">💙</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  A gentle reminder
                </h3>
                <p className="text-base text-foreground/80 leading-relaxed">
                  You do not have to do everything at once. This is a guide, not a rulebook. 
                  Some steps are time-sensitive, but many can wait until you feel ready. 
                  We're here to support you at your own pace.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStartGuide}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start Step-by-Step Guide
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center rounded-full border-2 border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition hover:bg-muted"
            >
              Not Right Now
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <button
              onClick={handleGoBack}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Back to Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;
