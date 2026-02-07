import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, FileX, FolderOpen, Search, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  );
};

/** Pre-configured empty state for no projects */
const NoProjectsEmpty: React.FC<{ action?: React.ReactNode }> = ({ action }) => (
  <EmptyState
    icon={FolderOpen}
    title="No projects found"
    description="Get started by creating your first project."
    action={action}
  />
);

/** Pre-configured empty state for no search results */
const NoResultsEmpty: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description={searchTerm
      ? `No items match "${searchTerm}". Try adjusting your search or filters.`
      : "Try adjusting your search or filters."
    }
  />
);

/** Pre-configured empty state for no documents */
const NoDocumentsEmpty: React.FC<{ action?: React.ReactNode }> = ({ action }) => (
  <EmptyState
    icon={FileX}
    title="No documents"
    description="Upload documents to get started with analysis."
    action={action}
  />
);

/** Pre-configured empty state for no analysis */
const NoAnalysisEmpty: React.FC<{ action?: React.ReactNode }> = ({ action }) => (
  <EmptyState
    icon={Inbox}
    title="No analysis available"
    description="Run an analysis to see insights for this project."
    action={action}
  />
);

export {
  EmptyState,
  NoProjectsEmpty,
  NoResultsEmpty,
  NoDocumentsEmpty,
  NoAnalysisEmpty
};
