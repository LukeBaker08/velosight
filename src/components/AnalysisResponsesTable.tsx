
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AnalysisResponse {
  prompt: string;
  response: any;
  timestamp?: string;
}

interface AnalysisResponsesTableProps {
  responses: AnalysisResponse[];
}

const AnalysisResponsesTable: React.FC<AnalysisResponsesTableProps> = ({ responses }) => {
  if (!responses || responses.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Analysis Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No responses yet. Run an analysis to see results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Analysis Responses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Prompt</TableHead>
              <TableHead>Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="align-top">{item.prompt}</TableCell>
                <TableCell>
                  {typeof item.response === 'object' ? (
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded-md overflow-auto max-h-60">
                      {JSON.stringify(item.response, null, 2)}
                    </pre>
                  ) : (
                    <span>{String(item.response)}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AnalysisResponsesTable;
