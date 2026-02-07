import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { APP_CONFIG } from '@/lib/constants';

const SettingsAccount: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
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
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? 'Admin' : 'User'}
            </Badge>
          </div>
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
