import { Activity, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-8 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 glass-panel">
      <div>
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gradient">NYC Construction Risk Predictor</h1>
        </div>
        <p className="mt-2 text-muted-foreground text-sm font-medium">
          AI-powered semantic risk analysis for NYC construction permits
        </p>
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <Activity className="w-4 h-4 animate-pulse" />
        RAG Pipeline Active
      </div>
    </header>
  );
};
