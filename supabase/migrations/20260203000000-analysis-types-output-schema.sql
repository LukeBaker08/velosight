-- Add output_schema column for Azure OpenAI structured outputs
-- Stores JSON Schema per analysis type, enforced at the API level

ALTER TABLE public.analysis_types
ADD COLUMN IF NOT EXISTS output_schema jsonb;

COMMENT ON COLUMN public.analysis_types.output_schema
IS 'JSON Schema for structured output enforcement via Azure OpenAI. Format: { name, strict, schema }';

-- Risk Analysis schema
UPDATE public.analysis_types
SET output_schema = '{
  "name": "risk_analysis",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "Context": {
        "type": "object",
        "properties": {
          "ProjectOverviewAndContextScan": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "objectives": { "type": "array", "items": { "type": "string" } },
              "lifecyclePhase": { "type": "string" },
              "deliveryApproach": { "type": "string" },
              "strategicRelevance": { "type": "string" },
              "environmentalContext": { "type": "string" }
            },
            "required": ["type", "objectives", "lifecyclePhase", "deliveryApproach", "strategicRelevance", "environmentalContext"],
            "additionalProperties": false
          }
        },
        "required": ["ProjectOverviewAndContextScan"],
        "additionalProperties": false
      },
      "analysisType": { "type": "string" },
      "OverallRating": {
        "type": "object",
        "properties": {
          "riskRating": { "type": "string", "enum": ["Low", "Moderate", "High", "Critical"] },
          "justification": { "type": "string" }
        },
        "required": ["riskRating", "justification"],
        "additionalProperties": false
      },
      "SelfAwareness": {
        "type": "object",
        "properties": {
          "DocumentationGaps": {
            "type": "object",
            "properties": {
              "gaps": { "type": "array", "items": { "type": "string" } },
              "summary": { "type": "string" }
            },
            "required": ["gaps", "summary"],
            "additionalProperties": false
          },
          "ConfidenceLevelRating": {
            "type": "object",
            "properties": {
              "rating": { "type": "string" },
              "justification": { "type": "string" }
            },
            "required": ["rating", "justification"],
            "additionalProperties": false
          },
          "EvidenceCompletenessCheck": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" },
              "missingInformation": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["summary", "missingInformation"],
            "additionalProperties": false
          }
        },
        "required": ["DocumentationGaps", "ConfidenceLevelRating", "EvidenceCompletenessCheck"],
        "additionalProperties": false
      },
      "DomainSpecific": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "domain": { "type": "string" },
            "summary": { "type": "string" }
          },
          "required": ["domain", "summary"],
          "additionalProperties": false
        }
      },
      "ProjectSpecific": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "area": { "type": "string" },
            "summary": { "type": "string" }
          },
          "required": ["area", "summary"],
          "additionalProperties": false
        }
      },
      "SentimentAnalysis": {
        "type": "object",
        "properties": {
          "MeetingSentimentAnalysis": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" },
              "implications": { "type": "string" }
            },
            "required": ["summary", "implications"],
            "additionalProperties": false
          }
        },
        "required": ["MeetingSentimentAnalysis"],
        "additionalProperties": false
      },
      "EarlyWarningPrompts": {
        "type": "object",
        "properties": {
          "SpeedToRiskInsight": {
            "type": "object",
            "properties": {
              "topRisksRequiringAttention": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "rating": { "type": "string", "enum": ["Low", "Medium", "High", "Critical"] },
                    "description": { "type": "string" },
                    "mitigations": { "type": "array", "items": { "type": "string" } }
                  },
                  "required": ["rating", "description", "mitigations"],
                  "additionalProperties": false
                }
              }
            },
            "required": ["topRisksRequiringAttention"],
            "additionalProperties": false
          },
          "EarlyIndicatorsOfFailure": {
            "type": "object",
            "properties": {
              "signs": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["signs"],
            "additionalProperties": false
          },
          "ExternalEnvironmentSensitivities": {
            "type": "object",
            "properties": {
              "sensitivity": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["sensitivity"],
            "additionalProperties": false
          }
        },
        "required": ["SpeedToRiskInsight", "EarlyIndicatorsOfFailure", "ExternalEnvironmentSensitivities"],
        "additionalProperties": false
      },
      "StrategicBigPicture": {
        "type": "object",
        "properties": {
          "OverallRiskScan": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" },
              "identifiedRisks": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["summary", "identifiedRisks"],
            "additionalProperties": false
          },
          "ReadinessToDeliver": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" }
            },
            "required": ["summary"],
            "additionalProperties": false
          },
          "AlignmentToStrategicOutcomes": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" },
              "alignmentAssessment": { "type": "string" }
            },
            "required": ["summary", "alignmentAssessment"],
            "additionalProperties": false
          }
        },
        "required": ["OverallRiskScan", "ReadinessToDeliver", "AlignmentToStrategicOutcomes"],
        "additionalProperties": false
      },
      "SummaryOfFindingsAndRecommendations": {
        "type": "object",
        "properties": {
          "findings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "nature": { "type": "string" },
                "sources": { "type": "array", "items": { "type": "string" } },
                "summary": { "type": "string" },
                "recommendation": { "type": "string" },
                "potentialImpact": { "type": "string" }
              },
              "required": ["nature", "sources", "summary", "recommendation", "potentialImpact"],
              "additionalProperties": false
            }
          }
        },
        "required": ["findings"],
        "additionalProperties": false
      }
    },
    "required": ["Context", "analysisType", "OverallRating", "SelfAwareness", "DomainSpecific", "ProjectSpecific", "SentimentAnalysis", "EarlyWarningPrompts", "StrategicBigPicture", "SummaryOfFindingsAndRecommendations"],
    "additionalProperties": false
  }
}'::jsonb
WHERE key = 'risk-analysis';

-- Delivery Confidence Assessment schema
UPDATE public.analysis_types
SET output_schema = '{
  "name": "delivery_confidence_assessment",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "SelfAwareness": {
        "type": "object",
        "properties": {
          "EvidenceCompletenessCheck": {
            "type": "object",
            "properties": {
              "assessment": { "type": "string" },
              "missingInformation": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["assessment", "missingInformation"],
            "additionalProperties": false
          },
          "DocumentationGaps": {
            "type": "object",
            "properties": {
              "gaps": { "type": "array", "items": { "type": "string" } },
              "expectedGaps": { "type": "string" }
            },
            "required": ["gaps", "expectedGaps"],
            "additionalProperties": false
          },
          "ConfidenceLevelRating": {
            "type": "object",
            "properties": {
              "rating": { "type": "string" },
              "rationale": { "type": "string" }
            },
            "required": ["rating", "rationale"],
            "additionalProperties": false
          }
        },
        "required": ["EvidenceCompletenessCheck", "DocumentationGaps", "ConfidenceLevelRating"],
        "additionalProperties": false
      },
      "Context": {
        "type": "object",
        "properties": {
          "ProjectOverview": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "objectives": { "type": "array", "items": { "type": "string" } },
              "deliveryApproach": { "type": "string" },
              "lifecyclePhase": { "type": "string" },
              "strategicRelevance": { "type": "string" },
              "environmentalContext": { "type": "string" }
            },
            "required": ["type", "objectives", "deliveryApproach", "lifecyclePhase", "strategicRelevance", "environmentalContext"],
            "additionalProperties": false
          }
        },
        "required": ["ProjectOverview"],
        "additionalProperties": false
      },
      "DeliveryConfidenceAssessment": {
        "type": "object",
        "properties": {
          "overallDeliveryConfidenceRating": { "type": "string" },
          "assessmentDimensions": {
            "type": "object",
            "properties": {
              "Overall": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "TransformationVision": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "GovernanceAndLeadership": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "CapabilityAndEngagement": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "DeliveryManagement": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "Solution": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "CommercialManagement": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              },
              "RiskManagement": {
                "type": "object",
                "properties": {
                  "rating": { "type": "string" },
                  "rationale": { "type": "string" }
                },
                "required": ["rating", "rationale"],
                "additionalProperties": false
              }
            },
            "required": ["Overall", "TransformationVision", "GovernanceAndLeadership", "CapabilityAndEngagement", "DeliveryManagement", "Solution", "CommercialManagement", "RiskManagement"],
            "additionalProperties": false
          },
          "keyRecommendations": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["overallDeliveryConfidenceRating", "assessmentDimensions", "keyRecommendations"],
        "additionalProperties": false
      },
      "analysisType": { "type": "string" }
    },
    "required": ["SelfAwareness", "Context", "DeliveryConfidenceAssessment", "analysisType"],
    "additionalProperties": false
  }
}'::jsonb
WHERE key = 'delivery-confidence';

-- Gateway Review schema
UPDATE public.analysis_types
SET output_schema = '{
  "name": "gateway_review",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "SelfAwareness": {
        "type": "object",
        "properties": {
          "EvidenceCompletenessCheck": {
            "type": "object",
            "properties": {
              "assessment": { "type": "string" },
              "missingInformation": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["assessment", "missingInformation"],
            "additionalProperties": false
          },
          "DocumentationGaps": {
            "type": "object",
            "properties": {
              "gaps": { "type": "array", "items": { "type": "string" } },
              "expectedGaps": { "type": "string" }
            },
            "required": ["gaps", "expectedGaps"],
            "additionalProperties": false
          },
          "ConfidenceLevelRating": {
            "type": "object",
            "properties": {
              "rating": { "type": "string" },
              "rationale": { "type": "string" }
            },
            "required": ["rating", "rationale"],
            "additionalProperties": false
          }
        },
        "required": ["EvidenceCompletenessCheck", "DocumentationGaps", "ConfidenceLevelRating"],
        "additionalProperties": false
      },
      "Context": {
        "type": "object",
        "properties": {
          "ProjectOverview": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "objectives": { "type": "array", "items": { "type": "string" } },
              "deliveryApproach": { "type": "string" },
              "lifecyclePhase": { "type": "string" },
              "strategicRelevance": { "type": "string" },
              "environmentalContext": { "type": "string" }
            },
            "required": ["type", "objectives", "deliveryApproach", "lifecyclePhase", "strategicRelevance", "environmentalContext"],
            "additionalProperties": false
          }
        },
        "required": ["ProjectOverview"],
        "additionalProperties": false
      },
      "OverallRating": {
        "type": "object",
        "properties": {
          "riskRating": { "type": "string" },
          "justification": { "type": "string" }
        },
        "required": ["riskRating", "justification"],
        "additionalProperties": false
      },
      "StrategicBigPicture": {
        "type": "object",
        "properties": {
          "OverallRiskScan": {
            "type": "object",
            "properties": {
              "identifiedRisks": { "type": "array", "items": { "type": "string" } },
              "summary": { "type": "string" }
            },
            "required": ["identifiedRisks", "summary"],
            "additionalProperties": false
          },
          "AlignmentToStrategicOutcomes": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" },
              "alignmentAssessment": { "type": "string" }
            },
            "required": ["summary", "alignmentAssessment"],
            "additionalProperties": false
          },
          "ReadinessToDeliver": {
            "type": "object",
            "properties": {
              "summary": { "type": "string" }
            },
            "required": ["summary"],
            "additionalProperties": false
          }
        },
        "required": ["OverallRiskScan", "AlignmentToStrategicOutcomes", "ReadinessToDeliver"],
        "additionalProperties": false
      },
      "GatewayReviewAssessment": {
        "type": "object",
        "properties": {
          "gateway": { "type": "string" },
          "overallRating": { "type": "string" },
          "overallRatingRationale": { "type": "string" },
          "gatewayCriteria": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "criterion": { "type": "string" },
                "rating": { "type": "string" },
                "rationale": { "type": "string" },
                "weakSignals": { "type": "string" }
              },
              "required": ["criterion", "rating", "rationale", "weakSignals"],
              "additionalProperties": false
            }
          },
          "keyRecommendations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "priority": { "type": "string" },
                "recommendation": { "type": "string" }
              },
              "required": ["priority", "recommendation"],
              "additionalProperties": false
            }
          }
        },
        "required": ["gateway", "overallRating", "overallRatingRationale", "gatewayCriteria", "keyRecommendations"],
        "additionalProperties": false
      },
      "analysisType": { "type": "string" }
    },
    "required": ["SelfAwareness", "Context", "OverallRating", "StrategicBigPicture", "GatewayReviewAssessment", "analysisType"],
    "additionalProperties": false
  }
}'::jsonb
WHERE key = 'gateway-review';

-- Hypothesis schema
UPDATE public.analysis_types
SET output_schema = '{
  "name": "hypothesis_analysis",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "SelfAwareness": {
        "type": "object",
        "properties": {
          "EvidenceCompletenessCheck": {
            "type": "object",
            "properties": {
              "assessment": { "type": "string" },
              "missingInformation": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["assessment", "missingInformation"],
            "additionalProperties": false
          },
          "DocumentationGaps": {
            "type": "object",
            "properties": {
              "gaps": { "type": "array", "items": { "type": "string" } },
              "expectedGaps": { "type": "string" }
            },
            "required": ["gaps", "expectedGaps"],
            "additionalProperties": false
          },
          "ConfidenceLevelRating": {
            "type": "object",
            "properties": {
              "rating": { "type": "string" },
              "rationale": { "type": "string" }
            },
            "required": ["rating", "rationale"],
            "additionalProperties": false
          }
        },
        "required": ["EvidenceCompletenessCheck", "DocumentationGaps", "ConfidenceLevelRating"],
        "additionalProperties": false
      },
      "Context": {
        "type": "object",
        "properties": {
          "ProjectOverview": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "objectives": { "type": "array", "items": { "type": "string" } },
              "deliveryApproach": { "type": "string" },
              "lifecyclePhase": { "type": "string" },
              "strategicRelevance": { "type": "string" },
              "environmentalContext": { "type": "string" }
            },
            "required": ["type", "objectives", "deliveryApproach", "lifecyclePhase", "strategicRelevance", "environmentalContext"],
            "additionalProperties": false
          }
        },
        "required": ["ProjectOverview"],
        "additionalProperties": false
      },
      "hypotheses": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "hypothesis_statement": { "type": "string" },
            "rationale": { "type": "array", "items": { "type": "string" } },
            "supporting_evidence": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "document": { "type": "string" },
                  "reference": { "type": "string" },
                  "note": { "type": "string" }
                },
                "required": ["document", "reference", "note"],
                "additionalProperties": false
              }
            },
            "testing_and_validation": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["hypothesis_statement", "rationale", "supporting_evidence", "testing_and_validation"],
          "additionalProperties": false
        }
      }
    },
    "required": ["SelfAwareness", "Context", "hypotheses"],
    "additionalProperties": false
  }
}'::jsonb
WHERE key = 'hypothesis';

-- Custom Prompt: simple schema that forces LLM to return a single string response
-- The backend extracts .response and stores it alongside the prompt as { prompt, output }
UPDATE public.analysis_types
SET output_schema = '{
  "name": "custom_prompt_response",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "response": { "type": "string" }
    },
    "required": ["response"],
    "additionalProperties": false
  }
}'::jsonb
WHERE key = 'custom-prompt';
