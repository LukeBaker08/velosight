import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { AnalysisResult, RiskAssessmentData, DeliveryConfidenceData, HypothesisData } from '@/components/project/insights/types';
import { Project } from '@/types/project';
import { extractModelUsed, extractAnalysisData } from '@/components/reports/common/helpers';

// Helper to convert string to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to sanitize filename (remove invalid characters but keep spaces for readability)
const sanitizeFilename = (str: string): string => {
  return str.replace(/[<>:"/\\|?*]/g, '').trim();
};

// Styles configuration
const STYLES = {
  title: { size: 48, bold: true, color: '1a1a2e' },
  heading1: { size: 32, bold: true, color: '1a1a2e' },
  heading2: { size: 28, bold: true, color: '16213e' },
  heading3: { size: 24, bold: true, color: '0f3460' },
  body: { size: 22, color: '333333' },
  muted: { size: 20, color: '666666', italics: true },
  badge: { size: 20, bold: true },
};

// Helper to format dimension keys (add spaces before capitals)
const formatDimensionKey = (key: string): string => {
  if (!key || typeof key !== 'string') return String(key || 'Unknown');
  if (key === 'Overall') return key;
  return key.replace(/([A-Z])/g, ' $1').trim();
};

// Create a styled paragraph
const createParagraph = (
  text: string,
  options: {
    heading?: HeadingLevel;
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
    spacing?: { before?: number; after?: number };
  } = {}
): Paragraph => {
  return new Paragraph({
    heading: options.heading,
    spacing: options.spacing || { after: 120 },
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italics,
        size: options.size || STYLES.body.size,
        color: options.color || STYLES.body.color,
      }),
    ],
  });
};

// Create bullet list
const createBulletList = (items: string[]): Paragraph[] => {
  return items.map(
    (item) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: item,
            size: STYLES.body.size,
            color: STYLES.body.color,
          }),
        ],
      })
  );
};

// Create a simple table
const createTable = (
  headers: string[],
  rows: string[][]
): Table => {
  const headerCells = headers.map(
    (header) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: STYLES.body.size,
                color: 'ffffff',
              }),
            ],
          }),
        ],
        shading: { fill: '1a1a2e' },
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      })
  );

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      size: STYLES.body.size,
                      color: STYLES.body.color,
                    }),
                  ],
                }),
              ],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
    },
    rows: [new TableRow({ children: headerCells }), ...dataRows],
  });
};

// Create report header section
const createReportHeader = (
  project: Project,
  analysis: AnalysisResult,
  reportType: string
): Paragraph[] => {
  const model = extractModelUsed(analysis.raw_result);
  const elements: Paragraph[] = [];

  // Title
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: reportType,
          ...STYLES.title,
        }),
      ],
    })
  );

  // Project name
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: project.name,
          size: 36,
          bold: true,
          color: STYLES.heading2.color,
        }),
      ],
    })
  );

  // Client
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Client: ${project.client}`,
          size: STYLES.body.size,
          color: STYLES.muted.color,
        }),
      ],
    })
  );

  // Metadata line
  const metadataItems: string[] = [];
  if (model) metadataItems.push(`Model: ${model}`);
  metadataItems.push(`Generated: ${format(new Date(analysis.created_at), 'dd MMM yyyy, HH:mm')}`);
  metadataItems.push(`Status: ${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}`);

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: metadataItems.join(' | '),
          ...STYLES.muted,
        }),
      ],
    })
  );

  return elements;
};

// Create Self-Awareness section (common across report types)
// Handles both raw data format (summary, justification) and transformed format (assessment, rationale)
const createSelfAwarenessSection = (selfAwareness: any): Paragraph[] => {
  if (!selfAwareness) return [];

  const elements: Paragraph[] = [];

  elements.push(createParagraph('Self-Awareness Assessment', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

  // Evidence Completeness - handles both 'summary' (raw) and 'assessment' (transformed)
  if (selfAwareness.EvidenceCompletenessCheck) {
    elements.push(createParagraph('Evidence Completeness', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
    const assessment = selfAwareness.EvidenceCompletenessCheck.summary || selfAwareness.EvidenceCompletenessCheck.assessment;
    if (assessment) {
      elements.push(createParagraph(assessment));
    }
    if (selfAwareness.EvidenceCompletenessCheck.missingInformation?.length) {
      elements.push(createParagraph('Missing Information:', { bold: true }));
      elements.push(...createBulletList(selfAwareness.EvidenceCompletenessCheck.missingInformation));
    }
  }

  // Documentation Gaps - handles both 'summary' (raw) and 'expectedGaps' (transformed)
  if (selfAwareness.DocumentationGaps) {
    elements.push(createParagraph('Documentation Gaps', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
    if (selfAwareness.DocumentationGaps.gaps?.length) {
      elements.push(...createBulletList(selfAwareness.DocumentationGaps.gaps));
    }
    const gapSummary = selfAwareness.DocumentationGaps.summary || selfAwareness.DocumentationGaps.expectedGaps;
    if (gapSummary) {
      elements.push(createParagraph(gapSummary, { italics: true }));
    }
  }

  // Confidence Level - handles both 'justification' (raw) and 'rationale' (transformed)
  if (selfAwareness.ConfidenceLevelRating) {
    elements.push(createParagraph('Confidence Level', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
    if (selfAwareness.ConfidenceLevelRating.rating) {
      elements.push(createParagraph(`Rating: ${selfAwareness.ConfidenceLevelRating.rating}`, { bold: true }));
    }
    const rationale = selfAwareness.ConfidenceLevelRating.justification || selfAwareness.ConfidenceLevelRating.rationale;
    if (rationale) {
      elements.push(createParagraph(rationale));
    }
  }

  return elements;
};

// Create Project Context section
const createProjectContextSection = (context: any): Paragraph[] => {
  if (!context) return [];

  const overview = context.ProjectOverview || context.ProjectOverviewAndContextScan;
  if (!overview) return [];

  const elements: Paragraph[] = [];

  elements.push(createParagraph('Project Context', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

  if (overview.type) {
    elements.push(createParagraph(`Project Type: ${overview.type}`, { bold: true }));
  }
  if (overview.deliveryApproach) {
    elements.push(createParagraph(`Delivery Approach: ${overview.deliveryApproach}`));
  }
  if (overview.lifecyclePhase) {
    elements.push(createParagraph(`Lifecycle Phase: ${overview.lifecyclePhase}`));
  }
  if (overview.objectives?.length) {
    elements.push(createParagraph('Objectives:', { bold: true }));
    elements.push(...createBulletList(overview.objectives));
  }
  if (overview.strategicRelevance) {
    elements.push(createParagraph('Strategic Relevance:', { bold: true }));
    elements.push(createParagraph(overview.strategicRelevance));
  }
  if (overview.environmentalContext) {
    elements.push(createParagraph('Environmental Context:', { bold: true }));
    elements.push(createParagraph(overview.environmentalContext));
  }

  return elements;
};

// Generate Risk Assessment DOCX content
// Handles both raw data format and transformed format from RiskAssessmentContent
const generateRiskAssessmentContent = (data: any): Paragraph[] => {
  const elements: Paragraph[] = [];

  // Overall Risk Rating - handles both OverallRating (raw) and OverallRiskRating (transformed)
  const overallRating = data.OverallRating || data.OverallRiskRating;
  if (overallRating || data.StrategicBigPicture?.OverallRiskScan) {
    elements.push(createParagraph('Overall Risk Assessment', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    const rating = overallRating?.riskRating || overallRating?.rating || data.StrategicBigPicture?.OverallRiskScan?.rating;
    const rationale = overallRating?.justification || overallRating?.rationale || data.StrategicBigPicture?.OverallRiskScan?.summary;

    if (rating) {
      elements.push(createParagraph(`Overall Risk Rating: ${rating}`, { bold: true, size: 28 }));
    }
    if (rationale) {
      elements.push(createParagraph(rationale));
    }
  }

  // Self-Awareness
  elements.push(...createSelfAwarenessSection(data.SelfAwareness));

  // Project Context
  elements.push(...createProjectContextSection(data.Context));

  // Strategic Big Picture - handles 'summary' (raw) and 'analysis' (transformed)
  if (data.StrategicBigPicture) {
    elements.push(createParagraph('Strategic Big Picture', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    // Overall Risk Scan
    if (data.StrategicBigPicture.OverallRiskScan) {
      const scanSummary = data.StrategicBigPicture.OverallRiskScan.summary || data.StrategicBigPicture.OverallRiskScan.analysis;
      if (scanSummary) {
        elements.push(createParagraph('Overall Risk Scan', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
        elements.push(createParagraph(scanSummary));
      }
    }

    // Alignment to Strategic Outcomes
    if (data.StrategicBigPicture.AlignmentToStrategicOutcomes) {
      const alignmentSummary = data.StrategicBigPicture.AlignmentToStrategicOutcomes.summary || data.StrategicBigPicture.AlignmentToStrategicOutcomes.analysis;
      if (alignmentSummary) {
        elements.push(createParagraph('Alignment to Strategic Outcomes', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
        elements.push(createParagraph(alignmentSummary));
      }
    }

    // Readiness to Deliver
    if (data.StrategicBigPicture.ReadinessToDeliver) {
      const readinessSummary = data.StrategicBigPicture.ReadinessToDeliver.summary || data.StrategicBigPicture.ReadinessToDeliver.analysis;
      if (readinessSummary) {
        elements.push(createParagraph('Readiness to Deliver', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
        elements.push(createParagraph(readinessSummary));
      }
    }
  }

  // Domain Specific Analysis - handles both array (raw) and object (transformed) formats
  if (data.DomainSpecific) {
    elements.push(createParagraph('Domain-Specific Analysis', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    if (Array.isArray(data.DomainSpecific)) {
      // Raw format: array of { domain, summary }
      data.DomainSpecific.forEach((item: any) => {
        if (item.domain) {
          elements.push(createParagraph(formatDimensionKey(item.domain), { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
          if (item.summary) {
            elements.push(createParagraph(item.summary));
          }
        }
      });
    } else {
      // Transformed format: object with named keys
      Object.entries(data.DomainSpecific).forEach(([domain, content]: [string, any]) => {
        elements.push(createParagraph(formatDimensionKey(domain), { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
        const analysis = content?.summary || content?.analysis;
        if (analysis) {
          elements.push(createParagraph(analysis));
        }
      });
    }
  }

  // Project Specific Analysis - handles both array (raw) and object (transformed) formats
  if (data.ProjectSpecific) {
    elements.push(createParagraph('Project-Specific Analysis', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    if (Array.isArray(data.ProjectSpecific)) {
      // Raw format: array of { area, summary }
      data.ProjectSpecific.forEach((item: any) => {
        if (item.area) {
          elements.push(createParagraph(formatDimensionKey(item.area), { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
          if (item.summary) {
            elements.push(createParagraph(item.summary));
          }
        }
      });
    } else {
      // Transformed format: object with named keys
      Object.entries(data.ProjectSpecific).forEach(([area, content]: [string, any]) => {
        elements.push(createParagraph(formatDimensionKey(area), { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
        const analysis = content?.summary || content?.analysis;
        if (analysis) {
          elements.push(createParagraph(analysis));
        }
      });
    }
  }

  // Sentiment Analysis
  if (data.SentimentAnalysis?.MeetingSentimentAnalysis) {
    elements.push(createParagraph('Sentiment Analysis', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    const sentimentSummary = data.SentimentAnalysis.MeetingSentimentAnalysis.summary || data.SentimentAnalysis.MeetingSentimentAnalysis.analysis;
    if (sentimentSummary) {
      elements.push(createParagraph('Meeting Sentiment', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
      elements.push(createParagraph(sentimentSummary));
    }

    if (data.SentimentAnalysis.MeetingSentimentAnalysis.implications) {
      elements.push(createParagraph('Implications:', { bold: true }));
      elements.push(createParagraph(data.SentimentAnalysis.MeetingSentimentAnalysis.implications));
    }
  }

  // Early Warning Prompts - handles raw data structure
  if (data.EarlyWarningPrompts) {
    elements.push(createParagraph('Early Warning Indicators', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    // Early Indicators of Failure - handles both 'signs' array (raw) and direct array (transformed)
    const failureIndicators = data.EarlyWarningPrompts.EarlyIndicatorsOfFailure?.signs ||
                              data.EarlyWarningPrompts.EarlyIndicatorsOfFailure;
    if (Array.isArray(failureIndicators) && failureIndicators.length > 0) {
      elements.push(createParagraph('Early Indicators of Failure', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
      elements.push(...createBulletList(failureIndicators));
    }

    // External Environment Sensitivities - handles 'sensitivity' array (raw) or string (transformed)
    const sensitivities = data.EarlyWarningPrompts.ExternalEnvironmentSensitivities?.sensitivity ||
                          data.EarlyWarningPrompts.ExternalEnvironmentSensitivities;
    if (sensitivities) {
      elements.push(createParagraph('External Environment Sensitivities', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
      if (Array.isArray(sensitivities)) {
        elements.push(...createBulletList(sensitivities));
      } else {
        elements.push(createParagraph(sensitivities));
      }
    }

    // Speed to Risk Insight - handles 'topRisksRequiringAttention' (raw) or direct array (transformed)
    const speedToRisk = data.EarlyWarningPrompts.SpeedToRiskInsight?.topRisksRequiringAttention ||
                        data.EarlyWarningPrompts.SpeedToRiskInsight;
    if (Array.isArray(speedToRisk) && speedToRisk.length > 0) {
      elements.push(createParagraph('Speed to Risk Insights', { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
      const rows = speedToRisk.map((item: any) => [
        item.description || '',
        item.rating || '',
        Array.isArray(item.mitigations) ? item.mitigations.join('; ') : (item.mitigation || item.mitigations || ''),
      ]);
      elements.push(createTable(['Description', 'Rating', 'Mitigation'], rows));
    }
  }

  // Summary of Findings - handles 'SummaryOfFindingsAndRecommendations.findings' (raw) or 'SummaryOfFindings' (transformed)
  const findings = data.SummaryOfFindingsAndRecommendations?.findings || data.SummaryOfFindings;
  if (Array.isArray(findings) && findings.length > 0) {
    elements.push(createParagraph('Summary of Findings & Recommendations', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    const rows = findings.map((finding: any) => [
      finding.summary || '',
      Array.isArray(finding.sources) ? finding.sources.join(', ') : (finding.source || ''),
      finding.potentialImpact || finding.impact || '',
      finding.recommendation || '',
    ]);
    elements.push(createTable(['Summary', 'Source', 'Impact', 'Recommendation'], rows));
  }

  return elements;
};

// Generate Delivery Confidence DOCX content
const generateDeliveryConfidenceContent = (data: DeliveryConfidenceData): Paragraph[] => {
  const elements: Paragraph[] = [];

  // Overall Rating
  if (data.DeliveryConfidenceAssessment?.overallDeliveryConfidenceRating) {
    elements.push(createParagraph('Overall Delivery Confidence', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));
    elements.push(
      createParagraph(`Rating: ${data.DeliveryConfidenceAssessment.overallDeliveryConfidenceRating}`, {
        bold: true,
        size: 28,
      })
    );
  }

  // Self-Awareness
  elements.push(...createSelfAwarenessSection(data.SelfAwareness));

  // Project Context
  elements.push(...createProjectContextSection(data.Context));

  // Assessment Dimensions
  if (data.DeliveryConfidenceAssessment?.assessmentDimensions) {
    elements.push(createParagraph('Assessment Dimensions', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    Object.entries(data.DeliveryConfidenceAssessment.assessmentDimensions).forEach(([dimension, content]) => {
      if (dimension === 'Overall') return; // Skip overall, already shown above

      elements.push(createParagraph(formatDimensionKey(dimension), { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 }));
      if (content?.rating) {
        elements.push(createParagraph(`Rating: ${content.rating}`, { bold: true }));
      }
      if (content?.rationale) {
        elements.push(createParagraph(content.rationale));
      }
    });
  }

  // Key Recommendations
  if (data.DeliveryConfidenceAssessment?.keyRecommendations?.length) {
    elements.push(createParagraph('Key Recommendations', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));
    elements.push(...createBulletList(data.DeliveryConfidenceAssessment.keyRecommendations));
  }

  return elements;
};

// Generate Hypothesis DOCX content
const generateHypothesisContent = (data: HypothesisData): Paragraph[] => {
  const elements: Paragraph[] = [];

  // Self-Awareness
  elements.push(...createSelfAwarenessSection(data.SelfAwareness));

  // Project Context
  elements.push(...createProjectContextSection(data.Context));

  // Hypotheses
  if (data.hypotheses?.length) {
    elements.push(createParagraph('Generated Hypotheses', { heading: HeadingLevel.HEADING_1, ...STYLES.heading1 }));

    data.hypotheses.forEach((hypothesis, index) => {
      elements.push(
        createParagraph(`Hypothesis ${index + 1}`, { heading: HeadingLevel.HEADING_2, ...STYLES.heading2 })
      );

      if (hypothesis.hypothesis_statement) {
        elements.push(createParagraph(hypothesis.hypothesis_statement, { bold: true }));
      }

      if (hypothesis.rationale?.length) {
        elements.push(createParagraph('Rationale:', { bold: true }));
        elements.push(...createBulletList(hypothesis.rationale));
      }

      if (hypothesis.supporting_evidence?.length) {
        elements.push(createParagraph('Supporting Evidence:', { bold: true }));
        const rows = hypothesis.supporting_evidence.map((ev) => [
          ev.document || '',
          ev.reference || '',
          ev.note || '',
        ]);
        elements.push(createTable(['Document', 'Reference', 'Note'], rows));
      }

      if (hypothesis.testing_and_validation?.length) {
        elements.push(createParagraph('Testing & Validation:', { bold: true }));
        elements.push(...createBulletList(hypothesis.testing_and_validation));
      }

      // Add spacing between hypotheses
      elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    });
  }

  return elements;
};

// Main export function
export const exportReportToDocx = async (
  project: Project,
  analysis: AnalysisResult,
  reportType: 'risk-assessment' | 'delivery-confidence' | 'gateway-review' | 'hypothesis'
): Promise<void> => {
  const data = extractAnalysisData(analysis.raw_result);
  if (!data) {
    throw new Error('Unable to extract analysis data for export');
  }

  // Determine report title
  const reportTitles: Record<string, string> = {
    'risk-assessment': 'Risk Assessment Report',
    'delivery-confidence': 'Delivery Confidence Assessment',
    'gateway-review': `Gateway Review${analysis.analysis_subtype ? ` - ${analysis.analysis_subtype}` : ''}`,
    'hypothesis': 'Hypothesis Analysis Report',
  };

  const reportTitle = reportTitles[reportType] || 'Analysis Report';

  // Generate content based on report type
  let reportContent: Paragraph[] = [];

  switch (reportType) {
    case 'risk-assessment':
      reportContent = generateRiskAssessmentContent(data as RiskAssessmentData);
      break;
    case 'delivery-confidence':
      reportContent = generateDeliveryConfidenceContent(data as DeliveryConfidenceData);
      break;
    case 'gateway-review':
      // Gateway review uses similar structure to DCA
      reportContent = generateDeliveryConfidenceContent(data as DeliveryConfidenceData);
      break;
    case 'hypothesis':
      reportContent = generateHypothesisContent(data as HypothesisData);
      break;
  }

  // Create the document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: STYLES.body.size,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'VeloSight',
                    size: 18,
                    color: '999999',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: '999999',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '999999',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '999999',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '999999',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...createReportHeader(project, analysis, reportTitle),
          ...reportContent,
        ],
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);

  // Build filename: Status - Project - Report Type - Export Date.docx
  const reportTypeNames: Record<string, string> = {
    'risk-assessment': 'Risk Assessment',
    'delivery-confidence': 'Delivery Confidence Assessment',
    'gateway-review': 'Gateway Review',
    'hypothesis': 'Hypothesis Analysis',
  };

  const status = toTitleCase(analysis.status || 'Draft');
  const projectName = sanitizeFilename(project.name);
  const reportTypeName = reportTypeNames[reportType] || toTitleCase(reportType);
  const exportDate = format(new Date(), 'dd MMM yyyy');

  const filename = `${status} - ${projectName} - ${reportTypeName} - ${exportDate}.docx`;
  saveAs(blob, filename);
};
