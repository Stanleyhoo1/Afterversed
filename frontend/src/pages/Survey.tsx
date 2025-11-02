import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  createSurveySession,
  fetchSurveySession,
  submitSurveyResults,
  type SurveyPayload,
} from "@/lib/api";
import { SESSION_STORAGE_KEY, SURVEY_STATE_STORAGE_KEY } from "@/lib/config";
import { Calendar } from "@/components/ui/calendar";

type QuestionType = "choice" | "multiple" | "date";

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
    id: "overwhelming",
    question: "This whole process can feel like a fog. What is the one thing that feels most overwhelming to you right now?",
    type: "choice",
    options: [
      "Just knowing where to start",
      "Arranging the funeral",
      "Dealing with money and bank accounts",
      "The legal paperwork (like a Will)",
      "Telling all the different companies",
      "All of the above, and I feel stuck",
      "Something else"
    ],
    required: true
  },
  {
    id: "todo_list",
    question: "We know the list of people to contact can feel endless. We can help you build a clear, simple checklist.\n\nWhich of these areas are on your mind? (Select any that apply)",
    type: "multiple",
    options: [
      "Household: (Council Tax, Gas, Electricity, Water)",
      "Money: (Bank Accounts, Credit Cards, Pensions, Insurance)",
      "Digital: (Email, Social Media, Subscriptions like Netflix)",
      "Personal: (Doctor, Dentist, Employer)",
      "I don't know where to start, and that's okay"
    ],
    required: false
  },
  {
    id: "death_certificate",
    question: "These are often the first big steps. We can guide you on what to do for each one.\n\n1. The Death Certificate",
    type: "choice",
    options: [
      "We've registered it and have copies.",
      "We've registered it but are waiting for copies.",
      "We haven't been able to do this yet.",
      "I'm not sure about this."
    ],
    required: true
  },
  {
    id: "the_will",
    question: "2. The Will",
    type: "choice",
    options: [
      "We have found the Will and know who the Executor is.",
      "We think there is a Will, but we haven't found it yet.",
      "We don't think there is a Will.",
      "I'm not sure, and it's stressful to think about."
    ],
    required: true
  },
  {
    id: "digital_world",
    question: "In today's world, our loved ones also leave behind a digital life. Are you worried about any of the following?",
    type: "choice",
    options: [
      "Their social media accounts (like Facebook)",
      "Their personal email",
      "Photos or videos stored on a phone or computer",
      "This isn't a priority for me right now."
    ],
    required: true
  },
  {
    id: "protecting_memories",
    question: "When the time is right, many people find comfort in gathering memories.\n\nIs protecting and perhaps one day sharing memories (like photos, stories, or videos) something you might be interested in?",
    type: "choice",
    options: [
      "Yes, that sounds like a lovely idea.",
      "Maybe, but not right now.",
      "I'm not sure."
    ],
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
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

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
          toast({
            title: "Working offline",
            description: "We'll keep your answers on this device until we can reconnect.",
          });
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
    } else if (currentQuestion.type === "date") {
      const existing = answers[currentQuestion.id];
      setDateAnswer(typeof existing === "string" ? existing : "");
      setSelectedOptions([]);
    } else {
      setSelectedOptions([]);
      setDateAnswer("");
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
      const payload: SurveyPayload = {
        answers: answersToSubmit,
        timestamp: new Date().toISOString(),
      };

      try {
        setIsSubmitting(true);
        await submitSurveyResults(sessionId, payload);
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
        toast({
          title: "All set",
          description: "We've saved your responses. You can review them below anytime.",
        });
      } catch (error) {
        console.error("Failed to submit survey results", error);
        toast({
          title: "Something went wrong",
          description: "We couldn't save your survey. Please try again.",
        });
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
    </div>
  );
};

export default Survey;
