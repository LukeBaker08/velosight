
import React from 'react';
import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult } from './types';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  onClick: (analysis: AnalysisResult) => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onClick }) => {
  const getConfidenceBadgeVariant = (confidence: string | null) => {
    if (!confidence) return "outline";
    
    const confidenceLower = confidence?.toLowerCase();
    if (confidenceLower?.includes('high') || confidenceLower?.includes('good')) return "confidence-high";
    if (confidenceLower?.includes('medium') || confidenceLower?.includes('satisfactory')) return "confidence-medium";
    if (confidenceLower?.includes('low') || confidenceLower?.includes('poor')) return "confidence-low";
    return "outline";
  };

  return (
    <div 
      className="flex flex-col p-3 border cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={() => onClick(analysis)}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileSearch className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium truncate">{analysis.analysis_type}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-1">
        {new Date(analysis.created_at).toLocaleString()}
      </p>
      {analysis.confidence && (
        <div className="mt-auto pt-1">
          <Badge variant={getConfidenceBadgeVariant(analysis.confidence)}>
            {analysis.confidence} Confidence
          </Badge>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
