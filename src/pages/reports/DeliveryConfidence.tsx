
import React from 'react';
import ReportLayout from './ReportLayout';
import DeliveryConfidenceContent from '@/components/reports/delivery-confidence/DeliveryConfidenceContent';

const DeliveryConfidence = () => {
  return (
    <ReportLayout title="Delivery Confidence Assessment Report" analysisType="Delivery Confidence Assessment">
      {(analysis, project) => (
        <DeliveryConfidenceContent analysis={analysis} project={project} />
      )}
    </ReportLayout>
  );
};

export default DeliveryConfidence;
