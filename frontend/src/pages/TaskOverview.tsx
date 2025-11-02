import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const cloudBackground = new URL("../../assets/cloud.png", import.meta.url).href;

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
    title: "Registry",
    description: "",
    icon: "📋",
    estimatedTime: "1-2 hours",
    priority: "urgent"
  },
  {
    id: "arrange_funeral",
    title: "Funeral",
    description: "",
    icon: "🕊️",
    estimatedTime: "Several days",
    priority: "important"
  },
  {
    id: "legal_financial",
    title: "Legal & Finance",
    description: "",
    icon: "⚖️",
    estimatedTime: "Ongoing",
    priority: "important"
  },
  {
    id: "notify_organizations",
    title: "Accounts",
    description: "",
    icon: "📧",
    estimatedTime: "2-3 hours",
    priority: "important"
  },
  {
    id: "digital_legacy",
    title: "Digital Legacy",
    description: "",
    icon: "💻",
    estimatedTime: "1-2 hours",
    priority: "when-ready"
  }
];

const TaskOverview = () => {
  const navigate = useNavigate();

  const handleStartGuide = useCallback(() => {
    navigate("/procedure");
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    navigate("/complete");
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'var(--gradient-bg)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-8 md:px-10 lg:px-12 py-12">
        <div className="w-full">
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

          {/* Main Tasks Grid */}
          <div className="relative mb-16">
            <div className="flex flex-col gap-24 md:gap-36 min-h-[220vh]">
              {mainTasks.map((task, index) => {
                const isLeftAligned = index % 2 === 0;
                const alignmentClass = isLeftAligned ? "items-start" : "items-end";
                const textAlignment = isLeftAligned ? "text-left" : "text-right";
                const edgeOffsetClass = isLeftAligned ? "ml-0 sm:ml-4" : "mr-0 sm:mr-4";

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex w-full",
                      isLeftAligned ? "justify-start" : "justify-end",
                    )}
                  >
                    <div className={cn("relative flex flex-col", alignmentClass, edgeOffsetClass)}>
                      <div
                        className={cn(
                          "w-[21.5rem] sm:w-[23rem] md:w-[24.5rem] lg:w-[26rem] aspect-[2400/1411] px-10 py-12 sm:px-12 sm:py-14 flex items-center justify-center transition-transform duration-300 hover:scale-[1.05] bg-no-repeat bg-center bg-contain",
                          textAlignment,
                        )}
                        style={{
                          backgroundImage: `url(${cloudBackground})`,
                        }}
                      >
                        <div className="w-full rounded-3xl border border-border/60 bg-background/85 px-6 py-6 sm:px-8 sm:py-8 flex items-center gap-6 shadow-sm">
                          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl sm:text-5xl">
                            {task.icon}
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="inline-flex items-center justify-center rounded-full bg-secondary/20 px-4 py-1 text-sm font-semibold text-secondary-foreground">
                                Step {index + 1}
                              </span>
                              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <span role="img" aria-hidden="true">🕒</span>
                                <span>{task.estimatedTime}</span>
                              </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                              {task.title}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
