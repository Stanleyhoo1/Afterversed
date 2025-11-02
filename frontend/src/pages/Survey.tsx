import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  createSurveySession,
  fetchSurveySession,
  submitSurveyResults,
  generateChecklist,
  getFinancialAssessment,
  type SurveyPayload,
} from "@/lib/api";
import { SESSION_STORAGE_KEY, SURVEY_STATE_STORAGE_KEY } from "@/lib/config";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type QuestionType = "choice" | "multiple" | "date" | "text";

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

const questions: Question[] = [
  {
    id: "date_of_passing",
    question: "When did they pass away?",
    type: "date",
    required: true,
  },
  {
    id: "todo_list",
    question: "We know the list of people to contact can feel endless. We can help you build a clear, simple checklist.\n\nWhich of these areas are on your mind? (Select any that apply)",
    type: "multiple",
    options: [
      "Register the death",
      "Arrange the funeral",
      "Handle legal and financial matters",
      "Notify organizations and services",
      "Handle digital legacy"
    ],
    required: false
  },
  {
    id: "death_certificate",
    question: "What's the situation with the Death Certificate?",
    type: "choice",
    options: [
      "We've registered it and have copies.",
      "We've registered it but are waiting for copies.",
      "We haven't been able to do this yet.",
    ],
    required: true
  },
  {
    id: "the_will",
    question: "The Will",
    type: "choice",
    options: [
      "We have found the Will and know who the Executor is.",
      "We think there is a Will, but we haven't found it yet.",
      "We don't think there is a Will.",
      "I'm not sure."
    ],
    required: true
  },
  {
    id: "place_of_death",
    question: "Where did the death occur? Please enter the postcode (UK only).",
    type: "text",
    options: [],
    required: true
  }
];

const parseISODate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  date.setHours(12, 0, 0, 0);
  return date;
};

const formatISODate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const computeStepFromAnswers = (answerMap: Record<string, string | string[]>): number => {
  for (let i = 0; i < questions.length; i++) {
    if (!answerMap[questions[i].id]) {
      return i;
    }
  }
  return questions.length - 1;
};

const Survey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [dateAnswer, setDateAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportInput, setSupportInput] = useState("");
  const [supportMessages, setSupportMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([]);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [generatedChecklist, setGeneratedChecklist] = useState<any>(null);
  const [needsFinancialHelp, setNeedsFinancialHelp] = useState(false);

  const hasCompleted = useMemo(() => Boolean(completedAt), [completedAt]);

  const currentQuestion = useMemo(() => questions[currentStep], [currentStep]);
  const progress = useMemo(() => Math.min(((currentStep + 1) / questions.length) * 100, 100), [currentStep]);

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      try {
        let storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        let resolvedSessionId = storedSessionId ? Number.parseInt(storedSessionId, 10) : NaN;

        if (Number.isNaN(resolvedSessionId)) {
          const created = await createSurveySession();
          resolvedSessionId = created.session_id;
          localStorage.setItem(SESSION_STORAGE_KEY, String(resolvedSessionId));
        }

        let answersFromStorage: Record<string, string | string[]> = {};
        const localStateRaw = localStorage.getItem(SURVEY_STATE_STORAGE_KEY);
        if (localStateRaw) {
          try {
            const parsed = JSON.parse(localStateRaw);
            if (parsed?.sessionId && parsed.sessionId !== resolvedSessionId) {
              localStorage.removeItem(SURVEY_STATE_STORAGE_KEY);
            } else if (parsed?.answers && typeof parsed.answers === "object") {
              answersFromStorage = parsed.answers;
            }
            if (parsed?.completedAt) {
              setCompletedAt(parsed.completedAt);
            }
          } catch {
            localStorage.removeItem(SURVEY_STATE_STORAGE_KEY);
          }
        }
        // Remove legacy survey storage key once we migrate to session-based storage.
        localStorage.removeItem("surveyAnswers");

        let resolvedAnswers = answersFromStorage;
        try {
          const session = await fetchSurveySession(resolvedSessionId);
          if (session.completed_at) {
            setCompletedAt(session.completed_at);
          }

          if (session.survey_data?.answers) {
            const remoteAnswers = session.survey_data.answers;
            if (Object.keys(remoteAnswers).length >= Object.keys(answersFromStorage).length) {
              resolvedAnswers = remoteAnswers;
            }
          }

        } catch (error) {
          console.error("Failed to fetch remote survey state", error);
          
          // If session not found (404), create a new one
          if (error instanceof Error && error.message.includes("404")) {
            console.log("Session not found, creating a new one");
            try {
              const created = await createSurveySession();
              resolvedSessionId = created.session_id;
              localStorage.setItem(SESSION_STORAGE_KEY, String(resolvedSessionId));
              localStorage.removeItem(SURVEY_STATE_STORAGE_KEY);
              resolvedAnswers = {};
              console.log("Created new session:", resolvedSessionId);
            } catch (createError) {
              console.error("Failed to create new session", createError);
              toast({
                title: "Unable to start survey",
                description: "Please refresh the page or try again later.",
              });
            }
          } else {
            toast({
              title: "Working offline",
              description: "We'll keep your answers on this device until we can reconnect.",
            });
          }
        }

        if (isActive) {
          setSessionId(resolvedSessionId);
          setAnswers(resolvedAnswers);
          setCurrentStep(
            questions.length > 0 ? computeStepFromAnswers(resolvedAnswers) : 0,
          );
        }
      } catch (error) {
        console.error("Failed to initialise survey session", error);
        toast({
          title: "Unable to start survey",
          description: "Please refresh the page or try again later.",
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isActive = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    try {
      localStorage.setItem(
        SURVEY_STATE_STORAGE_KEY,
        JSON.stringify({
          sessionId,
          answers,
          currentStep,
          completedAt,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error("Failed to persist survey state", error);
    }
  }, [answers, completedAt, currentStep, sessionId]);

  useEffect(() => {
    if (currentQuestion.type === "multiple") {
      const existing = answers[currentQuestion.id];
      setSelectedOptions(Array.isArray(existing) ? existing : []);
      setDateAnswer("");
      setTextAnswer("");
    } else if (currentQuestion.type === "date") {
      const existing = answers[currentQuestion.id];
      setDateAnswer(typeof existing === "string" ? existing : "");
      setSelectedOptions([]);
      setTextAnswer("");
    } else if (currentQuestion.type === "text") {
      const existing = answers[currentQuestion.id];
      setTextAnswer(typeof existing === "string" ? existing : "");
      setSelectedOptions([]);
      setDateAnswer("");
    } else {
      setSelectedOptions([]);
      setDateAnswer("");
      setTextAnswer("");
    }
  }, [answers, currentQuestion]);

  const handleComplete = useCallback(
    async (finalAnswers?: Record<string, string | string[]>) => {
      if (!sessionId) {
        toast({
          title: "Session not ready",
          description: "Please refresh the page to continue your survey.",
        });
        return;
      }

      const answersToSubmit = finalAnswers ?? answers;
      console.log("handleComplete: starting with answers", answersToSubmit);
      
      const payload: SurveyPayload = {
        answers: answersToSubmit,
        timestamp: new Date().toISOString(),
      };

      try {
        setIsSubmitting(true);
        console.log("handleComplete: submitting to API", { sessionId, payload });
        await submitSurveyResults(sessionId, payload);
        console.log("handleComplete: API submission successful");
        
        try {
          const completionTimestamp = new Date().toISOString();
          setCompletedAt(completionTimestamp);
          localStorage.setItem(
            SURVEY_STATE_STORAGE_KEY,
            JSON.stringify({
              sessionId,
              answers: answersToSubmit,
              currentStep: Math.max(questions.length - 1, 0),
              completedAt: completionTimestamp,
            }),
          );
        } catch (error) {
          console.error("Failed to persist completed survey state", error);
        }
        
        // Check if user needs financial help
        const todoList = answersToSubmit.todo_list;
        if (Array.isArray(todoList) && todoList.includes("Handle legal and financial matters")) {
          setNeedsFinancialHelp(true);
        }
        
        toast({
          title: "All set",
          description: "We've saved your responses. You can review them below anytime.",
        });
      } catch (error) {
        console.error("Failed to submit survey results", error);
        
        // If session not found, ask user to refresh
        if (error instanceof Error && error.message.includes("404")) {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please refresh the page to start over.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Something went wrong",
            description: "We couldn't save your survey. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, sessionId, toast],
  );

  const handleDateSelect = useCallback(
    (value?: Date) => {
      if (isSubmitting || !sessionId || hasCompleted) {
        return;
      }
      if (!value) {
        setDateAnswer("");
        setAnswers(prev => {
          const next = { ...prev };
          delete next[currentQuestion.id];
          return next;
        });
        return;
      }
      const isoValue = formatISODate(value);
      setDateAnswer(isoValue);
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: isoValue,
      }));
    },
    [currentQuestion.id, hasCompleted, isSubmitting, sessionId],
  );

  const handleDateContinue = useCallback(() => {
    if (isSubmitting || !sessionId || hasCompleted || !dateAnswer) {
      return;
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: dateAnswer };
    setAnswers(nextAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete(nextAnswers);
    }
  }, [answers, currentQuestion.id, currentStep, dateAnswer, handleComplete, hasCompleted, isSubmitting, sessionId]);

  const handleChoiceSelect = useCallback((option: string) => {
    if (isSubmitting || !sessionId || hasCompleted) {
      return;
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(nextAnswers);

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete(nextAnswers);
      }
    }, 500);
  }, [answers, currentQuestion.id, currentStep, handleComplete, hasCompleted, isSubmitting, sessionId]);

  const handleMultipleSelect = useCallback((option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  }, []);

  const handleMultipleNext = useCallback(() => {
    if (isSubmitting || !sessionId || hasCompleted) {
      return;
    }

    const nextAnswers = { ...answers, [currentQuestion.id]: [...selectedOptions] };
    setAnswers(nextAnswers);
    setSelectedOptions([]);

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete(nextAnswers);
    }
  }, [answers, currentQuestion.id, currentStep, handleComplete, hasCompleted, isSubmitting, selectedOptions, sessionId]);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setTextAnswer(event.target.value);
  }, []);

  const handleTextContinue = useCallback(() => {
    if (isSubmitting || !sessionId || hasCompleted || !textAnswer.trim()) {
      console.log("handleTextContinue: validation failed", { 
        isSubmitting, 
        sessionId, 
        hasCompleted, 
        textAnswerLength: textAnswer.trim().length 
      });
      return;
    }

    console.log("handleTextContinue: proceeding with answer", textAnswer.trim());
    const nextAnswers = { ...answers, [currentQuestion.id]: textAnswer.trim() };
    setAnswers(nextAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      console.log("handleTextContinue: calling handleComplete with", nextAnswers);
      handleComplete(nextAnswers);
    }
  }, [answers, currentQuestion.id, currentStep, textAnswer, handleComplete, hasCompleted, isSubmitting, sessionId]);

  const handleTextKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && textAnswer.trim() && !isSubmitting) {
      handleTextContinue();
    }
  }, [textAnswer, isSubmitting, handleTextContinue]);

  const handleBack = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate("/");
    }
  }, [currentStep, isSubmitting, navigate]);

  const handleSkip = useCallback(() => {
    if (isSubmitting || !sessionId || hasCompleted) {
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete, hasCompleted, isSubmitting, sessionId]);

  const handleGenerateChecklist = useCallback(async () => {
    if (!sessionId) {
      toast({
        title: "Session not ready",
        description: "Unable to generate checklist at this time.",
      });
      return;
    }

    setIsGeneratingChecklist(true);
    try {
      const result = await generateChecklist(sessionId, {
        location: answers.place_of_death ? `${answers.place_of_death}, UK` : "UK",
        relationship: "Family member",
        additional_context: "",
      });
      
      setGeneratedChecklist(result.checklist);
      toast({
        title: "Checklist Generated!",
        description: "Your personalized action plan is ready.",
      });
    } catch (error) {
      console.error("Failed to generate checklist", error);
      toast({
        title: "Generation Failed",
        description: "We couldn't create your checklist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingChecklist(false);
    }
  }, [sessionId, answers, toast]);

  const handleSupportSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = supportInput.trim();
      if (!trimmed) {
        return;
      }
      setSupportMessages(prev => [
        ...prev,
        { sender: "user", text: trimmed },
        { sender: "assistant", text: trimmed },
      ]);
      setSupportInput("");
    },
    [supportInput],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
          style={{
            background: "linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))",
          }}
        />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="text-lg text-muted-foreground">Loading your survey...</p>
        </div>
      </div>
    );
  }

  if (hasCompleted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
          style={{
            background: "linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))",
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-4xl space-y-8">
            <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border">
              <h1 className="text-3xl font-semibold text-foreground mb-6">
                Your responses are saved.
              </h1>
              <p className="text-muted-foreground mb-8">
                Below is everything you shared with us. You can revisit this page anytime—your progress
                is linked to this browser. If anything changes, we can update it together.
              </p>
              <div className="space-y-6">
                {questions.map(question => {
                  const answer = answers[question.id];
                  const hasAnswer = Array.isArray(answer) ? answer.length > 0 : Boolean(answer);
                  const formattedAnswer = Array.isArray(answer)
                    ? undefined
                    : question.type === "date" && typeof answer === "string"
                      ? parseISODate(answer)?.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }) ?? answer
                      : answer;
                  return (
                    <div key={question.id} className="rounded-xl border border-border bg-background p-6">
                      <h2 className="text-lg font-medium text-foreground mb-3">
                        {question.question}
                      </h2>
                      {hasAnswer ? (
                        Array.isArray(answer) ? (
                          <ul className="list-disc list-inside text-base text-foreground/80 space-y-1">
                            {answer.map(option => (
                              <li key={option}>{option}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-base text-foreground/80">{formattedAnswer ?? ""}</p>
                        )
                      ) : (
                        <p className="text-base text-muted-foreground italic">
                          No answer recorded.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/overview")}
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
              >
                View My Dashboard
              </button>
              {needsFinancialHelp && (
                <button
                  type="button"
                  onClick={() => navigate("/procedure")}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
                >
                  💰 Start Financial Calculations
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateChecklist}
                disabled={isGeneratingChecklist}
                className="inline-flex items-center justify-center rounded-full bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGeneratingChecklist ? "Generating..." : "🤖 Generate AI Checklist"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompletedAt(null);
                  setCurrentStep(0);
                  setSelectedOptions([]);
                }}
                className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3 text-base font-semibold text-foreground shadow-sm transition hover:bg-background/80"
              >
                Update My Answers
              </button>
            </div>

            {generatedChecklist && (
              <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-green-500">
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  🤖 AI-Generated Action Plan
                </h2>
                <p className="text-muted-foreground mb-6">
                  Based on your responses, here's a personalized checklist with automated assistance:
                </p>
                
                <div className="space-y-6">
                  {generatedChecklist.steps?.slice(0, 5).map((step: any, idx: number) => (
                    <div key={step.id} className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {idx + 1}. {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{step.summary}</p>
                      {step.automation_level !== "none" && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            {step.automation_level === "full" ? "✅ Fully Automated" : "⚡ Partially Automated"}
                          </span>
                        </div>
                      )}
                      {step.substeps && step.substeps.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm">
                          {step.substeps.slice(0, 3).map((substep: any) => (
                            <li key={substep.id} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="text-foreground/80">
                                {substep.title}
                                {substep.automation_agent_type && (
                                  <span className="ml-2 text-xs text-green-600">
                                    ({substep.automation_agent_type})
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mt-6 italic">
                  Showing first 5 steps. Full checklist includes {generatedChecklist.steps?.length || 0} steps with automated assistance where possible.
                </p>
              </div>
            )}

            {completedAt && (
              <p className="text-center text-sm text-muted-foreground">
                Last updated on {new Date(completedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
        style={{
          background: 'linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))',
        }}
      />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-gray-300 z-50">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-start min-h-screen">
        <div className="w-full max-w-3xl">
          {/* Question Counter */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-8 leading-relaxed whitespace-pre-line">
              {currentQuestion.question}
            </h2>

            {/* Choice Question */}
            {currentQuestion.type === "choice" && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleChoiceSelect(option)}
                    disabled={isSubmitting}
                    className="w-full text-left px-6 py-4 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 text-base md:text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Choice Question */}
            {currentQuestion.type === "multiple" && (
              <>
                <div className="space-y-3 mb-6">
                  {currentQuestion.options?.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-4 px-6 py-4 rounded-xl border-2 border-border bg-background hover:bg-primary/5 transition-all duration-200 cursor-pointer ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option)}
                        onChange={() => handleMultipleSelect(option)}
                        disabled={isSubmitting}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-base md:text-lg">{option}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleMultipleNext}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
              </>
            )}

            {/* Date Question */}
            {currentQuestion.type === "date" && (
              <div className="space-y-6">
                <Calendar
                  mode="single"
                  selected={dateAnswer ? parseISODate(dateAnswer) : undefined}
                  onSelect={handleDateSelect}
                  disabled={{ after: new Date() }}
                  initialFocus
                  className="mx-auto w-full max-w-[24.5rem] rounded-3xl border border-border bg-background px-5 py-5 shadow-inner"
                  classNames={{
                    months: "flex flex-col items-center space-y-5",
                    month: "space-y-5",
                    caption: "relative flex items-center justify-center",
                    caption_label: "text-base font-semibold",
                    head_row: "flex justify-center gap-2",
                    head_cell: "text-muted-foreground w-11 text-xs font-semibold uppercase tracking-wide text-center",
                    row: "flex justify-center gap-2",
                    table: "border-collapse mx-auto",
                    cell: "w-11 h-11 flex items-center justify-center",
                    day: "h-11 w-11 rounded-full text-sm font-medium transition-colors flex items-center justify-center aria-selected:bg-primary aria-selected:text-primary-foreground hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    day_today: "text-red-600 font-semibold",
                  }}
                />
                <button
                  type="button"
                  onClick={handleDateContinue}
                  disabled={isSubmitting || !dateAnswer}
                  className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Text Question */}
            {currentQuestion.type === "text" && (
              <div className="space-y-6">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={handleTextChange}
                  onKeyPress={handleTextKeyPress}
                  placeholder="Enter postcode (e.g., SW1A 1AA)"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 rounded-xl border-2 border-border bg-background text-base md:text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleTextContinue}
                  disabled={isSubmitting || !textAnswer.trim()}
                  className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Continue"}
                </button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium disabled:opacity-60 disabled:pointer-events-none"
            >
              ← Back
            </button>
            {!currentQuestion.required && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium disabled:opacity-60 disabled:pointer-events-none"
              >
                Skip →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isSupportOpen && (
          <div className="w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Need someone to talk to?</p>
                <p className="text-xs text-muted-foreground">We can listen while you breathe.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportOpen(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
                aria-label="Close support chat"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[50vh]">
              {supportMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Share whatever is on your mind. We will reflect it back so you can hear it out loud.
                </p>
              ) : (
                supportMessages.map((message, index) => (
                  <div
                    key={`${message.sender}-${index}`}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      message.sender === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "mr-auto bg-muted text-foreground",
                    )}
                  >
                    {message.text}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSupportSubmit} className="border-t border-border bg-card/80 px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={supportInput}
                onChange={(event) => setSupportInput(event.target.value)}
                placeholder="Say anything you need to"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
                disabled={!supportInput.trim()}
                aria-label="Send"
              >
                ↩
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsSupportOpen((prev) => !prev)}
          className="h-14 w-14 rounded-full bg-primary text-2xl text-primary-foreground shadow-xl transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary animate-gentle-float"
          aria-label={isSupportOpen ? "Close support chat" : "Open support chat"}
        >
          {isSupportOpen ? "×" : "💬"}
        </button>
      </div>
    </div>
  );
};

export default Survey;
