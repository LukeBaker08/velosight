
import React from 'react';
import AnalysisCard from './AnalysisCard';
import { AnalysisResult } from './types';

interface AnalysisHistoryGridProps {
  analysisHistory: AnalysisResult[];
  onAnalysisSelect: (analysis: AnalysisResult) => void;
}

const AnalysisHistoryGrid: React.FC<AnalysisHistoryGridProps> = ({ 
  analysisHistory, 
  onAnalysisSelect 
}) => {
  if (analysisHistory.length === 0) {
    return null;
  }
  
  return (
    <div className="pt-4 border-t border-border">
      <h3 className="text-sm font-medium mb-2">Analysis History</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {analysisHistory.map((analysis) => (
          <AnalysisCard 
            key={analysis.id}
            analysis={analysis}
            onClick={onAnalysisSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default AnalysisHistoryGrid;
