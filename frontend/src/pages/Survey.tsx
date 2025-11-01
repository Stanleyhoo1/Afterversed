import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  question: string;
  type: "choice" | "multiple";
  options: string[];
  required?: boolean;
}

const questions: Question[] = [
  {
    id: "where_you_are",
    question: "Just to help us understand where you are in this journey, which of these feels closest to where you are?",
    type: "choice",
    options: [
      "This loss is very recent (in the last few days).",
      "It has been a week or two.",
      "It has been a few weeks or more.",
      "I'd rather not say."
    ],
    required: true
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

const Survey = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const currentQuestion = useMemo(() => questions[currentStep], [currentStep]);
  const progress = useMemo(() => ((currentStep + 1) / questions.length) * 100, [currentStep]);

  const handleChoiceSelect = useCallback((option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
    }, 500);
  }, [currentStep, currentQuestion.id]);

  const handleMultipleSelect = useCallback((option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  }, []);

  const handleMultipleNext = useCallback(() => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedOptions }));
    setSelectedOptions([]);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, currentQuestion.id, selectedOptions]);

  const handleComplete = useCallback(() => {
    const surveyData = {
      answers,
      timestamp: new Date().toISOString()
    };
    
    console.log("=== SURVEY COMPLETED ===", surveyData);
    
    localStorage.setItem('surveyAnswers', JSON.stringify(surveyData));
    navigate("/complete");
  }, [answers, navigate]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate("/");
    }
  }, [currentStep, navigate]);

  const handleSkip = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

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
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
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
                    onClick={() => handleChoiceSelect(option)}
                    className="w-full text-left px-6 py-4 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 text-base md:text-lg"
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
                      className="flex items-center gap-4 px-6 py-4 rounded-xl border-2 border-border bg-background hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option)}
                        onChange={() => handleMultipleSelect(option)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-base md:text-lg">{option}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleMultipleNext}
                  className="w-full inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                >
                  Continue
                </button>
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              ← Back
            </button>
            {!currentQuestion.required && (
              <button
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
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
