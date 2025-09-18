/**
 * Internal Support contact page
 */

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, Clock } from 'lucide-react';

const Support = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Internal Support</h1>
          <p className="text-muted-foreground">
            Get help with technical issues, feature requests, or general questions about VeloSight
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For non-urgent questions, technical issues, or feature requests.
              </p>
              <div className="space-y-2">
                <p className="font-medium">support@velosight.internal</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Response time: 24-48 hours
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For immediate assistance during business hours.
              </p>
              <div className="space-y-2">
                <p className="font-medium">Available: Monday - Friday, 9 AM - 5 PM</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Response time: Within minutes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For urgent issues affecting business operations.
              </p>
              <div className="space-y-2">
                <p className="font-medium">+1 (555) 123-4567</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Available 24/7 for critical issues
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Before You Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To help us assist you more quickly, please:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Check the FAQ page for common solutions</li>
                <li>• Have your browser and version information ready</li>
                <li>• Include screenshots of any error messages</li>
                <li>• Describe the steps that led to the issue</li>
                <li>• Mention which project you were working on</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Quick Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Login Problems</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Clear browser cache and cookies</li>
                  <li>• Try an incognito/private browsing window</li>
                  <li>• Check if caps lock is enabled</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Upload Issues</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ensure file size is under 10MB</li>
                  <li>• Check file format is supported</li>
                  <li>• Try uploading from a different browser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Performance Issues</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Close unnecessary browser tabs</li>
                  <li>• Disable browser extensions</li>
                  <li>• Check internet connection speed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Analysis Not Loading</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Wait a few minutes and refresh</li>
                  <li>• Check if documents are uploaded properly</li>
                  <li>• Contact support if analysis takes over 10 minutes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Support;