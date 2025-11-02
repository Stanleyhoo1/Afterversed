import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { executeLangGraphWorkflow, type LangGraphWorkflowResponse } from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";

const LegalFinancialWorkflow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<LangGraphWorkflowResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [estateData, setEstateData] = useState({
    property_value: 350000,
    bank_balances: 12500,
    investments: 50000,
    debts: 15000,
    funeral_costs: 3500
  });

  const handleRunWorkflow = async () => {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      toast({
        title: "No Session Found",
        description: "Please complete the survey first",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setWorkflowResult(null);

    try {
      // Simulate step-by-step progress
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < 4) return prev + 1;
          return prev;
        });
      }, 2000);

      const result = await executeLangGraphWorkflow(
        parseInt(sessionId),
        estateData
      );

      clearInterval(stepInterval);
      setCurrentStep(5);
      setWorkflowResult(result);
      
      toast({
        title: "✅ Workflow Completed",
        description: "All agents have finished their tasks successfully",
      });
    } catch (error: any) {
      console.error("Workflow failed:", error);
      toast({
        title: "❌ Workflow Failed",
        description: error.message || "Please try again or check the console",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const steps = [
    { id: 1, name: "SearchAgent", description: "Finding banks and government offices", icon: "🔍", color: "blue" },
    { id: 2, name: "DraftingAgent", description: "Generating letters and forms", icon: "✍️", color: "purple" },
    { id: 3, name: "FormAgent", description: "Submitting forms to institutions", icon: "📤", color: "green" },
    { id: 4, name: "ComputeAgent", description: "Validating financial calculations", icon: "🧮", color: "orange" },
    { id: 5, name: "Complete", description: "Generating final report", icon: "📊", color: "emerald" }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
              🤖 LangGraph Multi-Agent System
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Legal & Financial Workflow
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Automated agent-to-agent communication using <span className="font-semibold text-indigo-600">LangGraph</span>
            <br />
            <span className="text-base text-gray-500">SearchAgent → DraftingAgent → FormAgent → ComputeAgent → Report</span>
          </p>
        </div>

        {!workflowResult ? (
          <>
            {/* Estate Data Input */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Estate Information</h2>
                <div className="text-sm text-gray-500">
                  Total: {formatCurrency(
                    estateData.property_value + estateData.bank_balances + estateData.investments - estateData.debts
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(estateData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setEstateData({ ...estateData, [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Progress */}
            {isRunning && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-indigo-100">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Agent Pipeline Progress</h2>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center p-5 rounded-xl transition-all duration-300 ${
                        currentStep > index
                          ? 'bg-green-50 border-2 border-green-400 shadow-md'
                          : currentStep === index
                          ? `bg-${step.color}-50 border-2 border-${step.color}-400 shadow-lg animate-pulse`
                          : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <div className="text-4xl mr-5">{step.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{step.name}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      {currentStep > index && (
                        <div className="text-green-600 text-3xl font-bold">✓</div>
                      )}
                      {currentStep === index && (
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            {!isRunning && (
              <div className="text-center">
                <button
                  onClick={handleRunWorkflow}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-16 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 hover:-translate-y-1"
                >
                  🚀 Start LangGraph Workflow
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  This will execute all 4 agents in sequence
                </p>
              </div>
            )}
          </>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="text-7xl mb-4">✅</div>
              <h2 className="text-4xl font-bold mb-2">{workflowResult.executive_summary.title}</h2>
              <p className="text-xl opacity-90">{workflowResult.executive_summary.description}</p>
            </div>

            {/* Key Findings */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">🎯 Key Findings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowResult.executive_summary.key_findings.map((finding, index) => (
                  <div key={index} className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <span className="text-2xl">💡</span>
                    <span className="text-gray-800">{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800">💰 Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gross Estate:</span>
                    <span className="font-bold text-lg">{formatCurrency(workflowResult.financial_summary.gross_estate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Debts & Costs:</span>
                    <span className="font-bold text-lg text-red-600">
                      -{formatCurrency(workflowResult.financial_summary.debts + workflowResult.financial_summary.funeral_costs)}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-semibold">Net Estate:</span>
                    <span className="font-bold text-2xl text-green-600">{formatCurrency(workflowResult.financial_summary.net_estate)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-800">📊 Tax Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nil-Rate Band:</span>
                    <span className="font-bold">{formatCurrency(workflowResult.tax_summary.nil_rate_band)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taxable Estate:</span>
                    <span className="font-bold">{formatCurrency(workflowResult.tax_summary.taxable_estate)}</span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-semibold">IHT Due:</span>
                    <span className={`font-bold text-2xl ${workflowResult.tax_summary.iht_due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(workflowResult.tax_summary.iht_due)}
                    </span>
                  </div>
                  {workflowResult.tax_summary.hmrc_match && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <span className="text-green-700 font-semibold">✓ HMRC Validated</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agent Timeline */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">🤖 Agent Timeline</h3>
              <div className="space-y-4">
                {workflowResult.timeline.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap">
                      Step {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-800 mb-2">{item.agent}</p>
                      <ul className="space-y-1">
                        {item.outputs.map((output, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">→</span>
                            <span>{output}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-green-600 text-2xl">✓</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">📋 Next Actions</h3>
              <div className="space-y-3">
                {workflowResult.next_actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                    <span className="text-xl mt-1">→</span>
                    <span className="text-gray-800">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Deadlines */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">📅 Key Deadlines</h3>
              <div className="space-y-3">
                {workflowResult.key_deadlines.map((deadline, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    deadline.priority === 'high' ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
                  }`}>
                    <div>
                      <p className="font-bold text-gray-800">{deadline.task}</p>
                      <p className="text-sm text-gray-600">{new Date(deadline.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      deadline.priority === 'high' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      {deadline.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Generated */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-purple-200">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">📄 Documents Generated</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-4xl font-bold text-purple-600">{workflowResult.documents_generated.bank_letters}</p>
                    <p className="text-sm text-gray-600">Bank Letters</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-indigo-600">{workflowResult.documents_generated.government_forms}</p>
                    <p className="text-sm text-gray-600">Government Forms</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-600">{workflowResult.documents_generated.total}</p>
                    <p className="text-sm text-gray-600">Total Documents</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center pt-6">
              <button
                onClick={() => navigate("/procedure")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-12 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                ✓ View Completed Tasks in Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalFinancialWorkflow;
