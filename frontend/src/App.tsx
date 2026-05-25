import { useState } from 'react';
import { Header } from './components/Header';
import { ProjectForm, type FormData } from './components/ProjectForm';
import { RiskDashboard, type RiskData } from './components/RiskDashboard';

function App() {
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://rash50-construction-risk-backend.hf.space/predict-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch risk prediction');
      }

      const result = await response.json();
      setRiskData(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred while connecting to the AI backend. Please ensure the FastAPI server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Panel - Sticky Form */}
          <div className="lg:col-span-5 relative">
            <div className="lg:sticky lg:top-8 bg-black/20 rounded-2xl border border-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Project Submission
              </h2>
              <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
              
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Dashboard */}
          <div className="lg:col-span-7">
            <RiskDashboard data={riskData} isLoading={isLoading} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
