
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AnalysisOutput from '../AnalysisOutput';
import { AnalysisResult } from './types';

interface AnalysisDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAnalysis: AnalysisResult | null;
  onUseAnalysis: (formattedContent: string) => void;
}

const AnalysisDetailsDialog: React.FC<AnalysisDetailsDialogProps> = ({
  isOpen,
  onClose,
  selectedAnalysis,
  onUseAnalysis
}) => {
  if (!selectedAnalysis) return null;
  
  const handleUseAnalysis = () => {
    // Format the content from this analysis
    let formattedContent = `# ${selectedAnalysis.analysis_type}\n\n`;
    
    if (selectedAnalysis.confidence) {
      formattedContent += `**Confidence Level:** ${selectedAnalysis.confidence}\n\n`;
    }
    
    if (selectedAnalysis.rating) {
      formattedContent += `**Overall Rating:** ${selectedAnalysis.rating}\n\n`;
    }
    
    // Extract content from raw_result if available
    const analysisContent = getAnalysisContent(selectedAnalysis);
    if (analysisContent) {
      formattedContent += `${typeof analysisContent === 'string' ? analysisContent : JSON.stringify(analysisContent)}\n\n`;
    }
    
    onUseAnalysis(formattedContent);
  };

  // Helper function to extract analysis content from raw_result
  const getAnalysisContent = (analysis: AnalysisResult) => {
    if (!analysis || !analysis.raw_result) return null;
    
    try {
      // Check if raw_result contains an output field (common in webhook responses)
      if (Array.isArray(analysis.raw_result) && analysis.raw_result[0]?.output) {
        return analysis.raw_result[0].output;
      }
      
      // Check if raw_result is an object with an output property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.output) {
        return analysis.raw_result.output;
      }
      
      // If raw_result has analysis_content property
      if (typeof analysis.raw_result === 'object' && analysis.raw_result?.analysis_content) {
        return analysis.raw_result.analysis_content;
      }
    } catch (error) {
      console.error('Error extracting analysis content from raw_result:', error);
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedAnalysis.analysis_type}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {new Date(selectedAnalysis.created_at).toLocaleString()}
          </p>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid gap-4">
            {selectedAnalysis.confidence && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Confidence Level</h4>
                <div className={`px-3 py-2 rounded-md ${
                  selectedAnalysis.confidence.toLowerCase().includes('high')
                    ? 'bg-green-50 text-green-800'
                    : selectedAnalysis.confidence.toLowerCase().includes('medium') 
                      ? 'bg-amber-50 text-amber-800' 
                      : 'bg-red-50 text-red-800'
                }`}>
                  {selectedAnalysis.confidence}
                </div>
              </div>
            )}
            
            {selectedAnalysis.rating && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Overall Rating</h4>
                <div className={`px-3 py-2 rounded-md ${
                  selectedAnalysis.rating.toLowerCase().includes('high')
                    ? 'bg-green-50 text-green-800'
                    : selectedAnalysis.rating.toLowerCase().includes('medium') 
                      ? 'bg-amber-50 text-amber-800' 
                      : 'bg-red-50 text-red-800'
                }`}>
                  {selectedAnalysis.rating}
                </div>
              </div>
            )}
            
            {getAnalysisContent(selectedAnalysis) && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Analysis Content</h4>
                <div className="whitespace-pre-wrap border p-3 rounded-md bg-muted/30">
                  {typeof getAnalysisContent(selectedAnalysis) === 'string' 
                    ? getAnalysisContent(selectedAnalysis) 
                    : JSON.stringify(getAnalysisContent(selectedAnalysis), null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleUseAnalysis}>Use This Analysis</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisDetailsDialog;
