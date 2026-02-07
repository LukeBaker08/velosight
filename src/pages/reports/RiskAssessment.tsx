
import React from 'react';
import ReportLayout from './ReportLayout';
import RiskAssessmentContent from '@/components/reports/risk-assessment/RiskAssessmentContent';


const RiskAssessment = () => {
  return (
    <ReportLayout title="Risk Assessment Report" analysisType="Risk Analysis" reportTypeKey="risk-assessment">
      {(analysis, project) => (
        <RiskAssessmentContent analysis={analysis} project={project} />
      )}
    </ReportLayout>
  );
};

export default RiskAssessment;
