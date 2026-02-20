import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Eye, Users } from 'lucide-react';

export interface RoleBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export const RoleBadge = ({ className, showIcon = true }: RoleBadgeProps) => {
  const { role, isContributor, isViewer } = useAuth();

  if (!role) return null;

  if (isContributor) {
    return (
      <Badge variant="default" className={className}>
        {showIcon && <Users className="w-3 h-3 mr-1" />}
        Contributor
      </Badge>
    );
  }

  if (isViewer) {
    return (
      <Badge variant="secondary" className={className}>
        {showIcon && <Eye className="w-3 h-3 mr-1" />}
        Viewer
      </Badge>
    );
  }

  return null;
};
