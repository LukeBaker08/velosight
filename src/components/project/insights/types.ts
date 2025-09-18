export interface AnalysisResult {
  id: string;
  project_id: string;
  analysis_type: string;
  analysis_subtype?: string; // New field for sub-type like gateway type
  confidence: string | null;
  rating: string | null;
  created_at: string;
  status: 'draft' | 'final'; // Changed from string to union type
  raw_result?: any;
}

// DCA specific types - updated to match the new JSON structure
export interface DeliveryConfidenceData {
  SelfAwareness?: {
    EvidenceCompletenessCheck?: {
      assessment?: string;
      missingInformation?: string[];
    };
    DocumentationGaps?: {
      gaps?: string[];
      expectedGaps?: string;
    };
    ConfidenceLevelRating?: {
      rating?: string;
      rationale?: string;
    };
  };
  Context?: {
    ProjectOverview?: {
      type?: string;
      objectives?: string[];
      deliveryApproach?: string;
      lifecyclePhase?: string;
      strategicRelevance?: string;
      environmentalContext?: string;
    };
  };
  DeliveryConfidenceAssessment?: {
    overallDeliveryConfidenceRating?: string;
    assessmentDimensions?: {
      [key: string]: {
        rating?: string;
        rationale?: string;
      }
    };
    keyRecommendations?: string[];
  };
}

// Risk Assessment specific types - updated to match the new JSON structure
export interface RiskAssessmentData {
  OverallRiskRating?: {
    rating?: string;
    rationale?: string;
  };
  SelfAwareness?: {
    EvidenceCompletenessCheck?: {
      assessment?: string;
      missingInformation?: string[];
    };
    DocumentationGaps?: {
      gaps?: string[];
      expectedGaps?: string;
    };
    ConfidenceLevelRating?: {
      rating?: string;
      rationale?: string;
    };
  };
  Context?: {
    ProjectOverviewAndContextScan?: {
      type?: string;
      objectives?: string[];
      deliveryApproach?: string;
      lifecyclePhase?: string;
      strategicRelevance?: string;
      environmentalContext?: string;
    };
  };
  StrategicBigPicture?: {
    OverallRiskScan?: {
      analysis?: string;
      rating?: string;
    };
    AlignmentToStrategicOutcomes?: {
      analysis?: string;
    };
    ReadinessToDeliver?: {
      analysis?: string;
    };
  };
  DomainSpecific?: {
    [key: string]: {
      analysis?: string;
    };
  };
  ProjectSpecific?: {
    [key: string]: {
      [key: string]: string;
    };
  };
  SentimentAnalysis?: {
    MeetingSentimentAnalysis?: {
      analysis?: string;
      implications?: string;
    };
  };
  EarlyWarningPrompts?: {
    EarlyIndicatorsOfFailure?: string[];
    ExternalEnvironmentSensitivities?: string;
    SpeedToRiskInsight?: Array<{
      description?: string;
      rating?: string;
      mitigation?: string;
    }>;
  };
  SummaryOfFindings?: Array<{
    summary?: string;
    source?: string;
    deviation?: string;
    impact?: string;
    recommendation?: string;
  }>;
}

// Hypothesis specific types
export interface HypothesisData {
  SelfAwareness?: {
    EvidenceCompletenessCheck?: {
      assessment?: string;
      missingInformation?: string[];
    };
    DocumentationGaps?: {
      gaps?: string[];
      expectedGaps?: string;
    };
    ConfidenceLevelRating?: {
      rating?: string;
      rationale?: string;
    };
  };
  Context?: {
    ProjectOverview?: {
      type?: string;
      objectives?: string[];
      deliveryApproach?: string;
      lifecyclePhase?: string;
      strategicRelevance?: string;
      environmentalContext?: string;
    };
  };
  hypotheses?: Array<{
    hypothesis_statement?: string;
    rationale?: string[];
    supporting_evidence?: Array<{
      document?: string;
      reference?: string;
      note?: string;
    }>;
    testing_and_validation?: string[];
  }>;
}
