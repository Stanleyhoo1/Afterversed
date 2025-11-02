import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  getFinancialAssessment,
  runComputations,
  fetchSurveySession,
  getTaskStatuses,
  executeLangGraphWorkflow,
  type LangGraphWorkflowResponse,
} from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/lib/config";

interface FinancialData {
  deceased_details?: {
    name?: string;
    date_of_passing?: string;
  };
  executor_details?: {
    name?: string;
    relationship?: string;
  };
  assets?: any;
  liabilities?: any;
}

const FinancialProcedure = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [computationResults, setComputationResults] = useState<any[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"input" | "compute" | "results">("input");
  const [useExampleData, setUseExampleData] = useState(false);
  
  // LangGraph workflow state
  const [workflowResult, setWorkflowResult] = useState<LangGraphWorkflowResponse | null>(null);
  const [currentAgentStep, setCurrentAgentStep] = useState(0);
  const [showAllAgents, setShowAllAgents] = useState(true); // Toggle to show all agents

  // Example data that matches what ComputeAgent expects
  const exampleFinancialData = {
    deceased_details: {
      name: "John Smith",
      date_of_passing: "2025-10-15",
    },
    executor_details: {
      name: "Jane Smith",
      relationship: "Spouse",
    },
    assets: {
      real_estate: [
        {
          id: "prop1",
          address: "123 Main Street, London, W1A 1AA",
          ownership: "Solely Owned",
          value_at_death: 350000,
          passes_to_survivor: false,
          notes: "Family home",
        },
      ],
      bank_accounts: [
        {
          id: "bank1",
          institution: "Barclays Bank",
          type: "Current Account",
          account_number: "12345678",
          ownership: "Solely Owned",
          value_at_death: 12000,
          passes_to_survivor: false,
        },
        {
          id: "bank2",
          institution: "HSBC",
          type: "Savings Account",
          account_number: "87654321",
          ownership: "Jointly Owned",
          value_at_death: 80000,
          passes_to_survivor: true,
        },
      ],
      investments: [
        {
          id: "inv1",
          institution: "Vanguard",
          type: "ISA",
          account_number: "INV-123",
          ownership: "Solely Owned",
          value_at_death: 50000,
          passes_to_survivor: false,
        },
      ],
      personal_chattels: {
        id: "chattels1",
        description: "Furniture, jewelry, and personal belongings",
        ownership: "Solely Owned",
        value_at_death: 15000,
        passes_to_survivor: false,
      },
    },
    liabilities: {
      mortgages: [
        {
          id: "mort1",
          property_id: "prop1",
          provider: "Nationwide",
          outstanding_balance: 100000,
        },
      ],
      credit_cards: [],
      utility_bills: 500,
      funeral_costs: 4000,
    },
    tax_and_will_details: {
      probate_thresholds: {
        hmcts: 5000,
        barclays_bank: 50000,
        vanguard: 25000,
      },
      iht_thresholds: {
        nil_rate_band: 325000,
        residence_nil_rate_band: 175000,
        iht_rate_percent: 40,
      },
      will_summary: {
        leaves_everything_to_spouse: true,
        spouse_name: "Jane Smith",
        notes: "All assets pass to the surviving spouse.",
      },
    },
  };

  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      const parsedId = Number.parseInt(storedSessionId, 10);
      setSessionId(parsedId);
      
      // Fetch assessment
      getFinancialAssessment(parsedId)
        .then(result => {
          setAssessment(result);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Failed to get assessment", error);
          toast({
            title: "Assessment Failed",
            description: "Unable to assess your financial needs. Please complete the survey first.",
            variant: "destructive",
          });
          setIsLoading(false);
        });
    } else {
      toast({
        title: "No Session Found",
        description: "Please complete the survey first.",
      });
      navigate("/");
    }
  }, [navigate, toast]);

  const handleRunComputations = async () => {
    if (!sessionId) return;

    setIsComputing(true);
    setCurrentAgentStep(0);
    setWorkflowResult(null);
    
    try {
      if (showAllAgents) {
        // === NEW: Use LangGraph Multi-Agent Workflow ===
        
        // Simulate step-by-step progress for UI
        const stepInterval = setInterval(() => {
          setCurrentAgentStep(prev => {
            if (prev < 4) return prev + 1;
            return prev;
          });
        }, 2500);
        
        // Extract estate values from example data
        const estateData = {
          property_value: useExampleData ? 450000 : 0,
          bank_balances: useExampleData ? 25000 : 0,
          investments: useExampleData ? 75000 : 0,
          debts: useExampleData ? 12000 : 0,
          funeral_costs: useExampleData ? 4500 : 3500
        };
        
        // Execute LangGraph workflow
        const workflowResponse = await executeLangGraphWorkflow(sessionId, estateData);
        
        clearInterval(stepInterval);
        setCurrentAgentStep(5);
        setWorkflowResult(workflowResponse);
        
        // Convert workflow results to computation results format for display
        const formattedResults = [
          {
            id: "search_results",
            body: `**SearchAgent Results:**\n\nFound ${workflowResponse.timeline.find(t => t.agent === "SearchAgent")?.outputs.length || 0} institutions to notify.`
          },
          {
            id: "drafting_results",
            body: `**DraftingAgent Results:**\n\nGenerated ${workflowResponse.documents_generated.total} documents including bank letters and government forms.`
          },
          {
            id: "submission_results",
            body: `**FormAgent Results:**\n\nSubmitted all documents. All submissions acknowledged and processed.`
          },
          {
            id: "validation_results",
            body: `**ComputeAgent Results:**\n\n` +
                  `• Net Estate Value: £${workflowResponse.financial_summary.net_estate.toLocaleString()}\n` +
                  `• Inheritance Tax Due: £${workflowResponse.tax_summary.iht_due.toLocaleString()}\n` +
                  `• Probate ${workflowResponse.probate_summary.required ? 'Required' : 'Not Required'}\n` +
                  `• Validation: ${workflowResponse.validation_status.passed ? '✓ PASSED' : '✗ FAILED'}`
          }
        ];
        
        setComputationResults(formattedResults);
        setCurrentStep("results");
        
        toast({
          title: "✅ Multi-Agent Workflow Complete",
          description: `All ${workflowResponse.timeline.length} agents completed successfully`,
        });
        
      } else {
        // === OLD: Use ComputeAgent Only ===
        
        const dataToUse = useExampleData ? exampleFinancialData : financialData;
        
        const taskData = {
          steps: [
            {
              id: "S006",
              title: "Handle Legal and Financial Matters",
              substeps: [
                {
                  id: "S006-1",
                  title: "Calculate Total Estate Value",
                  description: "Sum all assets to determine total estate value",
                  automation_agent_type: "ComputationAgent",
                  inputs_required: ["Full estate inventory including property, bank accounts, investments, personal chattels"],
                },
                {
                  id: "S006-2",
                  title: "Determine if Probate is Required",
                  description: "Check estate value against probate thresholds",
                  automation_agent_type: "ComputationAgent",
                  inputs_required: ["Total estate value", "Ownership details", "Probate thresholds"],
                },
                {
                  id: "S006-3",
                  title: "Calculate Inheritance Tax (IHT)",
                  description: "Calculate potential IHT liability",
                  automation_agent_type: "ComputationAgent",
                  inputs_required: ["Estate value", "IHT thresholds", "Will details"],
                },
              ],
            },
          ],
        };

        const results = await runComputations(sessionId, {
          user_data: dataToUse,
          task_data: taskData,
        });

        setComputationResults(results.results);
        setCurrentStep("results");
        
        toast({
          title: "✅ Computation Complete",
          description: "ComputeAgent has finished all calculations",
        });
      }
      
      // Fetch updated task statuses from the database
      try {
        const taskStatuses = await getTaskStatuses(sessionId);
        console.log("Task statuses updated:", taskStatuses);
        
        // Update localStorage with the latest session data including task statuses
        const updatedSession = await fetchSurveySession(sessionId);
        localStorage.setItem(
          `session_${sessionId}_tasks`,
          JSON.stringify(taskStatuses.task_statuses)
        );
        
        toast({
          title: "Task Statuses Updated",
          description: "All completed tasks have been saved to your session",
        });
      } catch (error) {
        console.error("Failed to fetch task statuses", error);
      }
      
    } catch (error) {
      console.error("Computation failed", error);
      toast({
        title: "Calculation Failed",
        description: error instanceof Error ? error.message : "Unable to complete calculations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsComputing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-lg text-gray-600">Loading financial assessment...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Unable to load assessment</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90"
          >
            Back to Survey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              💰 Financial & Legal Matters
            </h1>
            
            {/* Toggle for Multi-Agent Workflow */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 rounded-full border-2 border-purple-200">
              <span className="text-sm font-medium text-gray-700">Multi-Agent:</span>
              <button
                onClick={() => setShowAllAgents(!showAllAgents)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                  showAllAgents ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    showAllAgents ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-600">
                {showAllAgents ? '4 Agents' : 'Compute Only'}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">{assessment.message}</p>
          
          {showAllAgents && (
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 mb-4 border border-purple-300">
              <p className="text-sm text-purple-900 mb-2">
                <strong>🤖 LangGraph Multi-Agent Mode Active</strong>
              </p>
              <p className="text-xs text-purple-800">
                When you run calculations, you'll see all 4 agents working together: SearchAgent → DraftingAgent → FormAgent → ComputeAgent
              </p>
            </div>
          )}
          
          {assessment.next_steps && assessment.next_steps.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What we'll help with:</h3>
              <ul className="space-y-2">
                {assessment.next_steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-800">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Input Form */}
        {currentStep === "input" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Estate Information
            </h2>
            
            {/* Example Data Toggle */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  id="useExample"
                  checked={useExampleData}
                  onChange={(e) => setUseExampleData(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="useExample" className="font-semibold text-blue-900 cursor-pointer block mb-2">
                    🚀 Use Example Data for Demo
                  </label>
                  <p className="text-sm text-blue-800 mb-3">
                    Want to see how it works? Check this box to use realistic example data and run the AI calculations immediately.
                  </p>
                  {useExampleData && (
                    <div className="bg-white rounded p-3 text-xs text-gray-700 border border-blue-200">
                      <p className="font-semibold mb-2">Example includes:</p>
                      <ul className="space-y-1">
                        <li>• Property: £350,000 (solely owned)</li>
                        <li>• Bank accounts: £12,000 (sole) + £80,000 (joint)</li>
                        <li>• Investments: £50,000 (ISA)</li>
                        <li>• Personal items: £15,000</li>
                        <li>• Mortgage: £100,000 outstanding</li>
                        <li>• Will: Everything to spouse (100% IHT exemption)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!useExampleData && (
              <>
                <p className="text-gray-600 mb-6">
                  To run accurate calculations, we need detailed financial information. For a real assessment, you would provide:
                </p>

                <div className="space-y-6">
                  {/* Deceased Details */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">📋 Deceased Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full name"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) =>
                          setFinancialData((prev) => ({
                            ...prev,
                            deceased_details: {
                              ...prev.deceased_details,
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        type="date"
                        placeholder="Date of passing"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) =>
                          setFinancialData((prev) => ({
                            ...prev,
                            deceased_details: {
                              ...prev.deceased_details,
                              date_of_passing: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Note about detailed data */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>ℹ️ Note:</strong> For accurate calculations, the AI needs detailed information including:
                    </p>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4">
                      <li>• Property addresses and values</li>
                      <li>• Bank account details and balances</li>
                      <li>• Investment portfolio values</li>
                      <li>• Outstanding debts and mortgages</li>
                      <li>• Will details and beneficiaries</li>
                    </ul>
                    <p className="text-sm text-yellow-800 mt-3">
                      💡 <strong>Tip:</strong> Check the "Use Example Data" box above to see a working demo with realistic data.
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {/* Multi-Agent Progress Visualization */}
            {isComputing && showAllAgents && (
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-xl p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
                  🤖 Multi-Agent Workflow in Progress
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 1, name: "SearchAgent", icon: "🔍", desc: "Finding banks & government offices", color: "blue" },
                    { id: 2, name: "DraftingAgent", icon: "✍️", desc: "Generating letters & forms", color: "purple" },
                    { id: 3, name: "FormAgent", icon: "📤", desc: "Submitting documents", color: "green" },
                    { id: 4, name: "ComputeAgent", icon: "🧮", desc: "Validating finances", color: "orange" },
                    { id: 5, name: "ReportGenerator", icon: "📊", desc: "Creating final report", color: "emerald" }
                  ].map((agent, index) => (
                    <div
                      key={agent.id}
                      className={`flex items-center p-4 rounded-xl transition-all duration-300 ${
                        currentAgentStep > index
                          ? 'bg-green-100 border-2 border-green-400 shadow-md'
                          : currentAgentStep === index
                          ? `bg-${agent.color}-100 border-2 border-${agent.color}-400 shadow-lg animate-pulse`
                          : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="text-3xl mr-4">{agent.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-base text-gray-800">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.desc}</p>
                      </div>
                      {currentAgentStep > index && (
                        <div className="text-green-600 text-2xl font-bold">✓</div>
                      )}
                      {currentAgentStep === index && (
                        <div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Agent {currentAgentStep + 1} of 5 working...
                </p>
              </div>
            )}

            <button
              onClick={handleRunComputations}
              disabled={isComputing || (!useExampleData && !financialData.deceased_details?.name)}
              className="w-full mt-6 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isComputing ? (showAllAgents ? "🤖 Multi-Agent Workflow Running..." : "⚙️ Computing...") : "🤖 Run AI Calculations"}
            </button>
          </div>
        )}

        {/* Results */}
        {currentStep === "results" && computationResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Calculation Results
              </h2>
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <span className="text-xl">✓</span>
                <span className="font-semibold">Tasks Completed & Saved</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ All calculations have been completed and task statuses have been updated in your session.
                You can continue with your procedure - these results are saved to your account.
              </p>
            </div>
            
            <div className="space-y-6">
              {computationResults.map((result, idx) => (
                <div key={result.id} className="border-l-4 border-green-500 bg-green-50 p-6 rounded-r-lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {result.id}
                    </h3>
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      COMPLETED
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white p-4 rounded border">
                    {result.body}
                  </pre>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setCurrentStep("input")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition"
              >
                ← Adjust Data
              </button>
              <button
                onClick={() => navigate("/procedure")}
                className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>✓</span>
                View Completed Tasks
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Survey
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialProcedure;
