import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface Step {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  action?: string;
}

// Sample procedure steps based on grief support process
const procedureSteps: Step[] = [
  {
    id: "register_death",
    title: "Register the Death",
    description: "This is one of the first essential steps. You'll need to register the death within 5 days in England, Wales, and Northern Ireland (8 days in Scotland).",
    tasks: [
      {
        id: "register_death_1",
        title: "Contact the Register Office",
        description: "Find your local register office and book an appointment. You can usually do this by phone or online.",
        action: "Find contact details for your local register office"
      },
      {
        id: "register_death_2",
        title: "Gather Required Documents",
        description: "You'll need: Medical certificate of cause of death, the deceased's birth certificate, and proof of address.",
        action: "Collect all necessary documents"
      },
      {
        id: "register_death_3",
        title: "Attend the Appointment",
        description: "At the appointment, you'll provide the documents and the registrar will issue the death certificate.",
        action: "Attend your scheduled appointment"
      },
      {
        id: "register_death_4",
        title: "Order Death Certificates",
        description: "Get multiple certified copies (usually 5-10) as you'll need them for banks, insurance, etc.",
        action: "Order certified death certificates"
      }
    ]
  },
  {
    id: "arrange_funeral",
    title: "Arrange the Funeral",
    description: "Take your time with this. There's no rush, and you can arrange something that feels right for you and your loved one.",
    tasks: [
      {
        id: "arrange_funeral_1",
        title: "Choose a Funeral Director",
        description: "Research local funeral directors, get quotes, and choose one you feel comfortable with.",
        action: "Contact funeral directors for quotes"
      },
      {
        id: "arrange_funeral_2",
        title: "Decide on Burial or Cremation",
        description: "Consider the deceased's wishes, religious beliefs, and what feels right for your family.",
        action: "Make the decision on burial or cremation"
      },
      {
        id: "arrange_funeral_3",
        title: "Plan the Service",
        description: "Choose the date, location, readings, music, and who will speak. The funeral director can help guide you.",
        action: "Plan the funeral service details"
      },
      {
        id: "arrange_funeral_4",
        title: "Notify Family and Friends",
        description: "Let people know about the funeral arrangements. Consider using a funeral notice service.",
        action: "Inform family and friends"
      }
    ]
  },
  {
    id: "legal_financial",
    title: "Handle Legal and Financial Matters",
    description: "These steps can feel overwhelming, but we'll guide you through them one at a time.",
    tasks: [
      {
        id: "legal_financial_1",
        title: "Locate the Will",
        description: "Check with solicitors, the deceased's home, or the Probate Service to find the will.",
        action: "Search for the will"
      },
      {
        id: "legal_financial_2",
        title: "Contact the Executor",
        description: "If you're not the executor, contact the person named in the will. They'll handle the estate.",
        action: "Identify and contact the executor"
      },
      {
        id: "legal_financial_3",
        title: "Apply for Probate",
        description: "The executor needs to apply for probate to get legal authority to deal with the estate.",
        action: "Begin probate application"
      },
      {
        id: "legal_financial_4",
        title: "Notify Banks and Financial Institutions",
        description: "Contact banks, building societies, pension providers, and insurance companies.",
        action: "Notify financial institutions"
      }
    ]
  },
  {
    id: "notify_organizations",
    title: "Notify Organizations and Services",
    description: "Let relevant organizations know about the death. This helps close accounts and stop unnecessary correspondence.",
    tasks: [
      {
        id: "notify_organizations_1",
        title: "Tell Us Once Service",
        description: "Use the government's 'Tell Us Once' service to notify multiple departments at once.",
        action: "Register with Tell Us Once"
      },
      {
        id: "notify_organizations_2",
        title: "Utility Companies",
        description: "Contact gas, electricity, water, internet, and phone providers.",
        action: "Notify utility providers"
      },
      {
        id: "notify_organizations_3",
        title: "Cancel Subscriptions",
        description: "Cancel or transfer subscriptions like Netflix, magazines, gym memberships, etc.",
        action: "Cancel ongoing subscriptions"
      },
      {
        id: "notify_organizations_4",
        title: "Return Official Documents",
        description: "Return passport, driving license, and blue badge (if applicable) to the relevant authorities.",
        action: "Return official documents"
      }
    ]
  },
  {
    id: "digital_legacy",
    title: "Handle Digital Legacy",
    description: "In today's world, we also need to think about digital accounts and online presence.",
    tasks: [
      {
        id: "digital_legacy_1",
        title: "Social Media Accounts",
        description: "Decide whether to memorialize or close Facebook, Instagram, Twitter, and other social accounts.",
        action: "Manage social media accounts"
      },
      {
        id: "digital_legacy_2",
        title: "Email Accounts",
        description: "Consider accessing the email to retrieve important information before closing the account.",
        action: "Handle email accounts"
      },
      {
        id: "digital_legacy_3",
        title: "Online Shopping Accounts",
        description: "Close accounts with Amazon, eBay, and other online retailers.",
        action: "Close online shopping accounts"
      },
      {
        id: "digital_legacy_4",
        title: "Cloud Storage and Photos",
        description: "Access iCloud, Google Photos, Dropbox, etc. to preserve precious memories.",
        action: "Secure digital photos and files"
      }
    ]
  }
];

const Procedure = () => {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [startedSteps, setStartedSteps] = useState<Set<string>>(new Set());

  const currentStep = useMemo(() => procedureSteps[currentStepIndex], [currentStepIndex]);
  const isStepStarted = useMemo(() => startedSteps.has(currentStep.id), [startedSteps, currentStep.id]);
  const progress = useMemo(() => ((currentStepIndex + 1) / procedureSteps.length) * 100, [currentStepIndex]);

  const handleStartStep = useCallback(() => {
    setStartedSteps(prev => new Set(prev).add(currentStep.id));
    setCurrentTaskIndex(0);
  }, [currentStep.id]);

  const handleShowSomethingElse = useCallback(() => {
    // Go back to dashboard or show alternative guidance
    navigate("/complete");
  }, [navigate]);

  const handleCompleteTask = useCallback(() => {
    if (currentTaskIndex === null) return;

    const taskId = currentStep.tasks[currentTaskIndex].id;
    setCompletedTasks(prev => new Set(prev).add(taskId));

    // Move to next task or next step
    if (currentTaskIndex < currentStep.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // All tasks completed, move to next step
      if (currentStepIndex < procedureSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setCurrentTaskIndex(null);
      } else {
        // All steps completed
        navigate("/complete");
      }
    }
  }, [currentTaskIndex, currentStep, currentStepIndex, navigate]);

  const handleSkipTask = useCallback(() => {
    if (currentTaskIndex === null) return;

    // Move to next task without marking as completed
    if (currentTaskIndex < currentStep.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // Move to next step
      if (currentStepIndex < procedureSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setCurrentTaskIndex(null);
      } else {
        navigate("/complete");
      }
    }
  }, [currentTaskIndex, currentStep, currentStepIndex, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'var(--gradient-bg)',
        }}
      />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-secondary/20 z-50">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Step Counter */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {procedureSteps.length}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground mt-2">
              {currentStep.title}
            </h1>
          </div>

          {/* Main Content Card */}
          <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Step Description */}
            <div className="p-8 md:p-12 border-b border-border">
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                {currentStep.description}
              </p>
              
              {!isStepStarted && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleStartStep}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                  >
                    Let's start this step
                  </button>
                  <button
                    onClick={handleShowSomethingElse}
                    className="flex-1 inline-flex items-center justify-center rounded-full border-2 border-border bg-background px-8 py-4 text-base font-semibold text-foreground transition hover:bg-muted"
                  >
                    I'm not ready for this. Show me something else.
                  </button>
                </div>
              )}
            </div>

            {/* Tasks List */}
            {isStepStarted && (
              <div className="p-6 md:p-8">
                <div className="space-y-4">
                  {currentStep.tasks.map((task, index) => {
                    const isCompleted = completedTasks.has(task.id);
                    const isCurrent = currentTaskIndex === index;
                    const isFaded = currentTaskIndex !== null && !isCurrent && !isCompleted;

                    const taskClasses = [
                      "border-2 rounded-xl p-6 transition-all duration-300",
                      isCurrent ? "border-primary bg-primary/5 shadow-lg scale-105" : "border-border bg-background",
                      isFaded ? "opacity-30" : "opacity-100",
                      isCompleted ? "border-secondary bg-secondary/15" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={task.id}
                        className={taskClasses}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox/Status */}
                          <div className="flex-shrink-0 mt-1">
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                                <svg className="w-4 h-4 text-secondary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            ) : isCurrent ? (
                              <div className="w-6 h-6 rounded-full border-2 border-primary bg-primary/20"></div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-border"></div>
                            )}
                          </div>

                          {/* Task Content */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              {task.title}
                            </h3>
                            <p className="text-base text-muted-foreground mb-3">
                              {task.description}
                            </p>
                            
                            {task.action && (
                              <p className="text-sm text-primary font-medium italic">
                                Action: {task.action}
                              </p>
                            )}

                            {/* Action Buttons for Current Task */}
                            {isCurrent && (
                              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={handleCompleteTask}
                                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
                                >
                                  Complete & Continue
                                </button>
                                <button
                                  onClick={handleSkipTask}
                                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                                >
                                  Skip for now
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => {
                if (currentStepIndex > 0) {
                  setCurrentStepIndex(currentStepIndex - 1);
                  setCurrentTaskIndex(null);
                  setStartedSteps(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(currentStep.id);
                    return newSet;
                  });
                } else {
                  navigate("/complete");
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/complete")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              Exit Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procedure;
