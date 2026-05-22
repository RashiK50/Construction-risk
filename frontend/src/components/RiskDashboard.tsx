import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle, FileText, Building2, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export interface RiskData {
  risk_score: number;
  primary_risks: string[];
  recommended_mitigations: string[];
  historical_summary: string;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  retrieved_project_count: number;
  average_similarity_score: number;
}

interface RiskDashboardProps {
  data: RiskData | null;
  isLoading: boolean;
}

// Mock historical data as requested
const MOCK_PROJECTS = [
  { bin: '1040922', borough: 'Manhattan', risk: 'High', similarity: '92%' },
  { bin: '1058275', borough: 'Brooklyn', risk: 'Medium', similarity: '87%' },
  { bin: '3029112', borough: 'Brooklyn', risk: 'High', similarity: '84%' },
  { bin: '4110822', borough: 'Queens', risk: 'Low', similarity: '76%' },
];

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ data, isLoading }) => {
  
  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center min-h-[600px] border border-white/5 rounded-2xl bg-white/[0.02]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <Search className="w-16 h-16 text-primary animate-pulse relative z-10" />
          <motion.div 
            animate={{ 
              y: ["0%", "100%", "0%"],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-primary blur-[1px] z-20 top-0"
          />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Analyzing Project Context</h3>
        <p className="text-muted-foreground max-w-sm">
          Querying ChromaDB vector store and evaluating historical safety records with Gemini AI...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center min-h-[600px] border border-white/5 rounded-2xl bg-white/[0.02] border-dashed">
        <Building2 className="w-16 h-16 text-muted-foreground/30 mb-6" />
        <h3 className="text-xl font-medium text-muted-foreground mb-2">No Project Analyzed</h3>
        <p className="text-muted-foreground/60 max-w-sm text-sm">
          Submit the project details on the left to generate an AI-powered risk assessment.
        </p>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-emerald-400';
    if (score < 70) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getRiskBg = (score: number) => {
    if (score < 40) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score < 70) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getRiskLabel = (score: number) => {
    if (score < 40) return 'LOW RISK';
    if (score < 70) return 'MEDIUM RISK';
    return 'HIGH RISK';
  };

  const strokeDashoffset = 283 - (283 * data.risk_score) / 100;

  const getConfidenceColor = (level: string) => {
    if (level === 'HIGH') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (level === 'MEDIUM') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {data.confidence_level === 'LOW' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-6"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-semibold text-sm">Limited highly similar historical projects found.</h4>
            <p className="text-amber-400/80 text-xs mt-1">Predictions may be less reliable.</p>
          </div>
        </motion.div>
      )}

      {/* COMPONENT A - RISK SCORE CARD */}
      <div className={cn("glass-card rounded-2xl p-6 border flex items-center justify-between", getRiskBg(data.risk_score))}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold text-white/90">Overall AI Risk Score</h2>
            <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded border", getConfidenceColor(data.confidence_level))}>
              {data.confidence_level} CONFIDENCE
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Based on historical violation patterns</p>
          <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border", getRiskBg(data.risk_score), getRiskColor(data.risk_score))}>
            {data.risk_score >= 70 ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {getRiskLabel(data.risk_score)}
          </div>
        </div>
        
        {/* Circular Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
            <motion.circle 
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
              strokeLinecap="round"
              className={getRiskColor(data.risk_score)}
              style={{ strokeDasharray: 283 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={cn("text-3xl font-bold", getRiskColor(data.risk_score))}>{data.risk_score}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">/100</span>
          </div>
        </div>
      </div>

      {/* RETRIEVAL INSIGHTS CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 border flex items-center justify-around text-sm"
      >
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Retrieved Projects</span>
          <span className="font-semibold text-white text-lg">{data.retrieved_project_count}</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Similarity Score</span>
          <span className="font-semibold text-white text-lg">{data.average_similarity_score}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPONENT B - PRIMARY RISKS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-white">Primary Risks</h3>
          </div>
          {data.primary_risks.map((risk, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-sm text-red-100/90">{risk}</span>
            </motion.div>
          ))}
        </div>

        {/* COMPONENT C - RECOMMENDED MITIGATIONS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Recommended Mitigations</h3>
          </div>
          {data.recommended_mitigations.map((mitigation, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-sm text-emerald-100/90">{mitigation}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* COMPONENT D - HISTORICAL SUMMARY */}
      <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">AI Historical Analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.historical_summary}
        </p>
      </div>

      {/* COMPONENT E - RETRIEVED HISTORICAL PROJECTS */}
      <div className="glass-panel rounded-xl overflow-hidden border">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Retrieved Context Projects</h3>
          <span className="text-xs text-muted-foreground bg-black/40 px-2 py-1 rounded">Top 4 Semantic Matches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-black/40 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">BIN</th>
                <th className="px-4 py-3 font-medium">Borough</th>
                <th className="px-4 py-3 font-medium">Risk Level</th>
                <th className="px-4 py-3 font-medium">Similarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_PROJECTS.map((proj, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-primary/90">{proj.bin}</td>
                  <td className="px-4 py-3 text-foreground/80">{proj.borough}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                      proj.risk === 'High' ? 'bg-red-500/20 text-red-400' :
                      proj.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {proj.risk}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: proj.similarity }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{proj.similarity}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
};

// Also import Activity for the risk badge fallback
import { Activity } from 'lucide-react';
