import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { APP_CONFIG } from '@/lib/constants';
import { UserCog, Eye } from 'lucide-react';

const SettingsAccount: React.FC = () => {
  const { user, role, isContributor, isViewer } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>
          View your account details and permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium">User ID</label>
          <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <div className="mt-1">
            {isContributor && (
              <Badge variant="default" className="flex items-center gap-1 w-fit">
                <UserCog className="w-3 h-3" />
                Contributor
              </Badge>
            )}
            {isViewer && (
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <Eye className="w-3 h-3" />
                Viewer
              </Badge>
            )}
            {!role && (
              <Badge variant="outline">No Role Assigned</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isContributor && 'You have full access to all features.'}
            {isViewer && 'You have read-only access.'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Application Version</label>
          <p className="text-sm text-muted-foreground">
            {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsAccount;
