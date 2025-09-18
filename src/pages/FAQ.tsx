
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FAQ = () => {
  const faqCategories = [
    {
      category: "Getting Started",
      color: "bg-blue-100 text-blue-800",
      faqs: [
        {
          question: "What is VeloSight?",
          answer: "VeloSight is a comprehensive project management and delivery confidence assessment platform designed to help organizations track, analyze, and improve their project delivery capabilities. It provides insights into project risks, performance metrics, and delivery confidence through advanced analytics and reporting."
        },
        {
          question: "How do I create my first project?",
          answer: "Navigate to the Projects page from the main dashboard and click 'Create New Project'. Fill in the project details including name, client, stage, and other relevant information. Once created, you can upload documents, conduct analyses, and generate reports."
        },
        {
          question: "What types of documents can I upload?",
          answer: "VeloSight supports various document formats including PDF, Word documents, Excel spreadsheets, and text files. Documents can be categorized by type (e.g., contracts, specifications, reports) to help organize your project materials."
        }
      ]
    },
    {
      category: "Project Management",
      color: "bg-green-100 text-green-800",
      faqs: [
        {
          question: "How do I track project stages?",
          answer: "Project stages are managed through the project settings and can be updated as your project progresses. The system tracks stage transitions and provides insights into stage duration and bottlenecks."
        },
        {
          question: "What are the different risk levels?",
          answer: "VeloSight uses a standardized risk assessment framework with levels ranging from Low to Critical. Each risk level has specific criteria and recommended actions to help teams manage and mitigate potential issues."
        },
        {
          question: "How do I generate delivery confidence reports?",
          answer: "Navigate to your project and select 'Reports' > 'Delivery Confidence Assessment'. The system will analyze your project data and generate a comprehensive report including self-awareness metrics, risk assessments, and delivery predictions."
        }
      ]
    },
    {
      category: "Analytics & Reporting",
      color: "bg-purple-100 text-purple-800",
      faqs: [
        {
          question: "What insights can I get from my project data?",
          answer: "VeloSight provides various insights including delivery confidence scores, risk trend analysis, document analysis summaries, timeline predictions, and performance benchmarks against similar projects."
        },
        {
          question: "How are delivery confidence scores calculated?",
          answer: "Delivery confidence scores are calculated using a proprietary algorithm that considers multiple factors including project complexity, team experience, risk levels, timeline adherence, and historical performance data."
        },
        {
          question: "Can I export reports?",
          answer: "Yes, all reports can be exported in multiple formats including PDF for presentations and Excel for further analysis. Use the export buttons available in each report section."
        }
      ]
    },
    {
      category: "Knowledge Repository",
      color: "bg-yellow-100 text-yellow-800",
      faqs: [
        {
          question: "What is the Knowledge Repository?",
          answer: "The Knowledge Repository is a centralized collection of assurance materials, best practices, templates, and organizational knowledge that can be leveraged across projects to improve delivery outcomes."
        },
        {
          question: "How do I add materials to the Knowledge Repository?",
          answer: "Navigate to the Knowledge Repository section and use the upload functionality to add documents, templates, or other materials. Categorize them appropriately to make them easily discoverable by other team members."
        },
        {
          question: "Who can access the Knowledge Repository?",
          answer: "Access to the Knowledge Repository depends on your user role. Generally, all authenticated users can view materials, while contributors and administrators can add or modify content."
        }
      ]
    },
    {
      category: "User Management & Access",
      color: "bg-red-100 text-red-800",
      faqs: [
        {
          question: "What are the different user roles?",
          answer: "VeloSight has several user roles: Viewer (read-only access), Contributor (can create and edit projects), Project Manager (full project management capabilities), and Administrator (system-wide management access)."
        },
        {
          question: "How do I request additional access?",
          answer: "Contact your system administrator or use the internal support contact option in the footer. Provide details about the specific access you need and the business justification."
        },
        {
          question: "Can I change my password?",
          answer: "Password management is handled through the authentication system. Use the 'Forgot Password' option on the login screen to reset your password if needed."
        }
      ]
    },
    {
      category: "Technical Support",
      color: "bg-gray-100 text-gray-800",
      faqs: [
        {
          question: "What browsers are supported?",
          answer: "VeloSight works best with modern browsers including Chrome (recommended), Firefox, Safari, and Edge. Ensure your browser is updated to the latest version for optimal performance."
        },
        {
          question: "Why is my page loading slowly?",
          answer: "Slow loading can be caused by large document uploads, network connectivity, or browser issues. Try refreshing the page, clearing your browser cache, or using a different browser. Contact support if issues persist."
        },
        {
          question: "How do I report a bug or request a feature?",
          answer: "Use the 'Contact Internal Support' link in the footer to report bugs or request new features. Provide detailed information about the issue including steps to reproduce, browser information, and screenshots if applicable."
        },
        {
          question: "Is my data secure?",
          answer: "Yes, VeloSight implements industry-standard security measures including encrypted data transmission, secure authentication, and regular security audits. All data is stored securely and access is logged for audit purposes."
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about using VeloSight</p>
        </div>

        <div className="space-y-6">
          {faqCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={category.color}>{category.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you can't find the answer you're looking for, don't hesitate to reach out to our internal support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h4 className="font-medium mb-2">Internal Support</h4>
                <p className="text-sm text-muted-foreground">
                  Contact our internal support team for technical assistance, feature requests, or general questions about using VeloSight.
                </p>
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-2">Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Visit the Knowledge Repository for detailed documentation, templates, and best practices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FAQ;
