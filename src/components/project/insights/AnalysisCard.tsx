
import React from 'react';
import { FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult } from './types';
import { getConfidenceBadgeVariant } from '@/lib/badge-helpers';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  onClick: (analysis: AnalysisResult) => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onClick }) => {
  return (
    <div
      className="flex flex-col p-4 border border-border/50 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onClick(analysis)}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileSearch className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium truncate">{analysis.analysis_type}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {new Date(analysis.created_at).toLocaleString()}
      </p>
      {analysis.confidence && (
        <div className="mt-auto pt-2">
          <Badge variant={getConfidenceBadgeVariant(analysis.confidence)}>
            {analysis.confidence} Confidence
          </Badge>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
