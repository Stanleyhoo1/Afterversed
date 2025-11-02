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
    description: "Take your time with this. There's no rush, and you can arrange something that feels right.",
    icon: "🕊️",
    estimatedTime: "Several days",
    priority: "important"
  },
  {
    id: "legal_financial",
    title: "Legal & Finance",
    description: "We'll guide you through finding the will, contacting banks, and applying for probate.",
    icon: "⚖️",
    estimatedTime: "Ongoing",
    priority: "important"
  },
  {
    id: "notify_organizations",
    title: "Accounts",
    description: "Let relevant organizations know about the death to close accounts and stop correspondence.",
    icon: "📧",
    estimatedTime: "2-3 hours",
    priority: "important"
  },
  {
    id: "digital_legacy",
    title: "Digital Legacy",
    description: "Manage social media accounts, email, and preserve precious digital memories.",
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
                const edgeOffsetClass = isLeftAligned ? "ml-0 sm:ml-3" : "mr-0 sm:mr-3";

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
                          "w-[14.5rem] sm:w-[15.5rem] md:w-[16.5rem] lg:w-[17rem] aspect-[2400/1411] px-6 py-8 sm:px-8 sm:py-9 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.05] bg-no-repeat bg-center bg-contain",
                          textAlignment,
                        )}
                        style={{
                          backgroundImage: `url(${cloudBackground})`,
                        }}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-4 mb-6",
                            isLeftAligned ? "justify-start" : "justify-end flex-row-reverse",
                          )}
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl sm:text-4xl text-primary">
                            {task.icon}
                          </div>
                          <div className="space-y-2">
                            <span className="inline-flex items-center justify-center rounded-full bg-secondary/20 px-4 py-1 text-sm font-semibold text-secondary-foreground">
                              Step {index + 1}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                              {task.title}
                            </h2>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed mb-4">
                            {task.description}
                          </p>
                        )}

                        <div
                          className={cn(
                            "flex flex-wrap items-center gap-3",
                            isLeftAligned ? "justify-start" : "justify-end",
                          )}
                        >
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{task.estimatedTime}</span>
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
