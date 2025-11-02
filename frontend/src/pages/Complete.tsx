import { useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";

const Complete = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const surveyData = localStorage.getItem('surveyAnswers');
    if (!surveyData) {
      navigate('/');
    }
  }, [navigate]);

  const handleViewDashboard = useCallback(() => {
    navigate("/procedure");
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
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Completion Message */}
          <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border text-center">
            <div className="mb-8">
              {/* Success icon or graphic */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>

              <h1 className="text-3xl md:text-4xl font-medium text-foreground mb-6">
                Thank you for sharing that.
              </h1>
              
              <div className="space-y-4 text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                <p>
                  It gives us a gentle place to start.
                </p>
                <p>
                  Based on what you've told us, we've created a simple, step-by-step guide for you. You can see it on your dashboard.
                </p>
                <p className="font-medium text-foreground">
                  Please remember: You do not have to do this all at once. We are here to help you take it one small step at a time.
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-10">
              <button
                onClick={handleViewDashboard}
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                View My Dashboard
              </button>
            </div>
          </div>

          {/* Supportive footer message */}
          <p className="text-center text-sm text-muted-foreground mt-8 px-4">
            You can always come back and update your answers if things change
          </p>
        </div>
      </div>
    </div>
  );
};

export default Complete;
