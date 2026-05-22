import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FormData {
  job_type: string;
  borough: string;
  building_type: string;
  initial_cost: number;
  total_construction_floor_area: number;
  proposed_no_of_stories: number;
  applicant_professional_title: string;
  work_types: string[];
  project_description: string;
}

interface ProjectFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const WORK_TYPES = [
  'Structural', 'Mechanical', 'Plumbing', 
  'Excavation', 'Demolition', 'Foundation', 'Electrical'
];

const JOB_TYPES = ['A1', 'A2', 'A3', 'NB', 'DM'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const BUILDING_TYPES = ['1-2-3 Family', 'Commercial', 'Mixed Use', 'Industrial'];
const TITLES = ['PE', 'RA', 'GC', 'Owner', 'Other'];

const LOADING_MESSAGES = [
  "Embedding project profile...",
  "Searching historical permits...",
  "Retrieving violation history...",
  "Generating AI analysis..."
];

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    job_type: 'A1',
    borough: 'Manhattan',
    building_type: 'Commercial',
    initial_cost: 1000000,
    total_construction_floor_area: 5000,
    proposed_no_of_stories: 5,
    applicant_professional_title: 'PE',
    work_types: [],
    project_description: '',
  });

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMsgIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWorkType = (type: string) => {
    setFormData(prev => {
      const exists = prev.work_types.includes(type);
      return {
        ...prev,
        work_types: exists 
          ? prev.work_types.filter(t => t !== type)
          : [...prev.work_types, type]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* SECTION A - PROJECT DETAILS */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">A. Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Job Type</label>
            <select 
              value={formData.job_type}
              onChange={(e) => handleChange('job_type', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Borough</label>
            <select 
              value={formData.borough}
              onChange={(e) => handleChange('borough', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              {BOROUGHS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Building Type</label>
            <select 
              value={formData.building_type}
              onChange={(e) => handleChange('building_type', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION B - SCALE */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">B. Project Scale</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Initial Cost ($)</label>
            <input 
              type="number"
              value={formData.initial_cost}
              onChange={(e) => handleChange('initial_cost', Number(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Floor Area (sq ft)</label>
            <input 
              type="number"
              value={formData.total_construction_floor_area}
              onChange={(e) => handleChange('total_construction_floor_area', Number(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Stories</label>
            <input 
              type="number"
              value={formData.proposed_no_of_stories}
              onChange={(e) => handleChange('proposed_no_of_stories', Number(e.target.value))}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION C & D - INFO & WORK TYPES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">C. Applicant Info</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Professional Title</label>
            <select 
              value={formData.applicant_professional_title}
              onChange={(e) => handleChange('applicant_professional_title', e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
            >
              {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">D. Work Types</h3>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map(type => {
              const active = formData.work_types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleWorkType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border",
                    active 
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                      : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION E - DESCRIPTION */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">E. Project Description</h3>
        <textarea 
          rows={4}
          placeholder="Describe the proposed construction scope..."
          value={formData.project_description}
          onChange={(e) => handleChange('project_description', e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none resize-none placeholder:text-muted-foreground/50"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        disabled={isLoading}
        type="submit"
        className="w-full relative group overflow-hidden rounded-lg p-[1px]"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative bg-black/60 backdrop-blur-sm px-6 py-4 rounded-[7px] flex items-center justify-center gap-3 transition-colors group-hover:bg-black/40">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
              <div className="overflow-hidden relative h-6 flex-1 flex items-center">
                <motion.span 
                  key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-semibold text-white tracking-wide absolute"
                >
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </motion.span>
              </div>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
              <span className="font-semibold text-white tracking-wide">Analyze Construction Risk</span>
            </>
          )}
        </div>
      </motion.button>
    </form>
  );
};
