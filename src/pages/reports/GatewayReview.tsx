
import React from 'react';
import ReportLayout from './ReportLayout';
import GatewayReviewContent from '@/components/reports/gateway-review/GatewayReviewContent';

const GatewayReview = () => {
  return (
    <ReportLayout title="Gateway Review Report" analysisType="Gateway Review">
      {(analysis, project) => (
        <GatewayReviewContent analysis={analysis} project={project} />
      )}
    </ReportLayout>
  );
};

export default GatewayReview;
