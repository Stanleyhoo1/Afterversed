import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

const Index = () => {
  const navigate = useNavigate();
  
  const handleContinue = useCallback(() => {
    navigate("/survey");
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[hsl(210,15%,92%)] to-[hsl(220,15%,85%)]"
        style={{
          background: 'linear-gradient(135deg, hsl(210, 15%, 92%), hsl(220, 15%, 85%))',
        }}
      />
      
      {/* Sun-like glow from top-right */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(45, 95%, 60%) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Message Container with speech bubble design */}
          <div className="relative">
            {/* Avatar circle */}
            <div className="absolute -left-4 top-0 w-24 h-24 rounded-full bg-gray-300 shadow-lg md:-left-8 md:w-32 md:h-32"></div>
            
            {/* Speech bubble */}
            <div className="ml-24 bg-gray-200 rounded-3xl shadow-2xl p-8 md:ml-32 md:p-12 relative">
              {/* Speech bubble tail */}
              <div className="absolute -left-6 top-8 w-0 h-0 border-t-[20px] border-t-transparent border-r-[30px] border-r-gray-200 border-b-[20px] border-b-transparent"></div>
              
              {/* Message content */}
              <div className="text-gray-800 space-y-4">
                <p className="text-lg md:text-xl leading-relaxed">
                  We are so very sorry for your loss.
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  We know this is an impossibly difficult time. Our only goal is to help make things a little bit clearer and lighter.
                </p>
                <p className="text-lg md:text-xl leading-relaxed">
                  To understand how we can best support you, we have a few gentle questions. Please know that there are no right or wrong answers, and it is perfectly okay if you don't know the answer to something.
                </p>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <div className="mt-12 text-center">
            <button
              onClick={handleContinue}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
