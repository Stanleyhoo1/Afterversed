import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { SESSION_STORAGE_KEY, API_BASE_URL } from "@/lib/config";
import { fetchDraftEmails, type DraftEmailResponse } from "@/lib/api";

interface EmailTemplate {
  heading: string;
  body: string;
}

const EmailTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedSessionId) {
        toast({
          title: "No Session Found",
          description: "Please complete the survey first.",
        });
        navigate("/");
        return;
      }

      try {
        const sessionIdNum = Number.parseInt(storedSessionId, 10);
        const data = await fetchDraftEmails(sessionIdNum);
        setTemplates(data.drafts || []);
      } catch (error) {
        console.error("Failed to load email templates:", error);
        toast({
          title: "Error",
          description: "Failed to load email templates. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-lg text-gray-600">Loading email templates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📧 Email Templates
          </h1>
          <p className="text-gray-600">
            Below are pre-written email templates for notifying organizations about the death.
            Click any template to open it in your default email app. You can then add the
            recipient's email address and make any necessary adjustments before sending.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <p className="text-gray-500">No email templates available yet.</p>
            </div>
          ) : (
            templates.map((template, index) => (
              <div
                key={index}
                className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-6 group"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setTemplates(templates.filter((_, i) => i !== index));
                    toast({
                      description: "Email template removed",
                    });
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 text-gray-400 
                           opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 
                           transition-all duration-200"
                  aria-label="Delete template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Email Template Link */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(template.heading)}&body=${encodeURIComponent(template.body)}`}
                  className="block"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span role="img" aria-label="email">✉️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {template.heading}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-line line-clamp-3">
                        {template.body}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-primary">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Open in Email App
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Task Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;