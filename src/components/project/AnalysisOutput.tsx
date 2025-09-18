
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AnalysisOutputProps {
  output: any;
  isError?: boolean;
}

const AnalysisOutput: React.FC<AnalysisOutputProps> = ({ output, isError = false }) => {
  if (!output) {
    return null;
  }

  const formatOutput = () => {
    if (isError) {
      return output.message || 'An error occurred during analysis.';
    }

    try {
      // Format based on analysis output structure
      if (typeof output === 'string') {
        return output;
      } else if (output.message) {
        return output.message;
      } else if (Array.isArray(output) && output[0]?.output) {
        return output[0].output;
      } else {
        return JSON.stringify(output, null, 2);
      }
    } catch (e) {
      console.error('Error formatting output:', e);
      return 'Error formatting analysis output.';
    }
  };

  return (
    <Card className={`w-full ${isError ? 'border-red-300' : ''}`}>
      <CardHeader className={`${isError ? 'bg-red-50' : ''}`}>
        <div className="flex items-center gap-2">
          {isError && <AlertTriangle className="text-red-500 h-5 w-5" />}
          <CardTitle className="text-lg">
            {output.analysisType ? `${output.analysisType} Result` : 'Analysis Output'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
          {formatOutput()}
        </pre>
      </CardContent>
    </Card>
  );
};

export default AnalysisOutput;
