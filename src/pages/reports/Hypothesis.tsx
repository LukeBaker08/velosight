
import React from 'react';
import ReportLayout from './ReportLayout';
import HypothesisContent from '@/components/reports/hypothesis/HypothesisContent';

const Hypothesis: React.FC = () => {
  return (
    <ReportLayout
      title="Hypothesis Report"
      analysisType="Hypothesis"
    >
      {(analysis, project) => (
        <HypothesisContent analysis={analysis} project={project} />
      )}
    </ReportLayout>
  );
};

export default Hypothesis;
