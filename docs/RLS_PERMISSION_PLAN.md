# Row Level Security (RLS) and Permission System Plan

## Executive Summary

This document outlines the implementation plan for a comprehensive role-based access control (RBAC) system in VeloSight using Supabase Row Level Security (RLS).

## Current State

### Existing Roles
- **admin**: Currently the default role for all users (will be renamed to 'contributor')
- Checked in: `webhooks`, `analysis_types` tables
- Frontend checks `isAdmin` via AuthContext (will become `isContributor`)

### Tables Missing RLS Protection
1. **projects** - Core project data ⚠️ HIGH PRIORITY
2. **analysis_results** - Sensitive analysis outputs ⚠️ HIGH PRIORITY
3. **profiles** - User role information ⚠️ CRITICAL
4. **prompts** - System prompts
5. **dropdown_categories** & **dropdown_values** - Reference data
6. **project_vector** & **framework_vector** - Embeddings

## Proposed Role System

### Role Hierarchy (Simplified)

```
Contributor (full access)
  └─ Viewer (read-only)
```

### Permission Matrix

| Resource | Contributor | Viewer |
|----------|-------------|--------|
| **Projects** | CRUD | R |
| **Documents** | CRUD | R |
| **Framework Materials** | CRUD | R |
| **Analysis Results** | CRUD (run analyses) | R |
| **Analysis Types** | CRUD | R |
| **Webhooks** | CRUD | R |
| **App Settings** | CRUD | R |
| **Prompts** | CRUD | R |
| **Profiles** | CRUD | R (own) |
| **Dropdown Data** | CRUD | R |
| **Vector Tables** | System access | System access |
| **Storage (documents)** | CRUD | R |
| **Storage (materials)** | CRUD | R |

**Legend:**
- C = Create
- R = Read
- U = Update
- D = Delete

**Notes:**
- Contributors have full access to all application features
- Viewers have read-only access across the board
- Both roles can view their own profile
- Only Contributors can manage user roles (change viewer ↔ contributor)

## Implementation Steps

### Phase 1: Update User Profile System

**Migration: `20260218000000-rbac-system.sql`**

1. **Update profiles table**
   - Rename existing 'admin' role to 'contributor'
   - Change default role for new users to 'viewer'
   - Add role constraint: `CHECK (role IN ('contributor', 'viewer'))`
   - Keep all existing users as 'contributor'

2. **Create helper functions**
   ```sql
   -- Check if user is a contributor
   CREATE FUNCTION auth.is_contributor()
   RETURNS boolean AS $$
     SELECT EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'contributor'
     );
   $$ LANGUAGE sql SECURITY DEFINER;
   ```

### Phase 2: Enable RLS on Unprotected Tables

**Critical Tables First:**

1. **profiles**
   ```sql
   -- Contributors can manage all profiles (change roles)
   -- Users can view their own profile
   -- Viewers can only view their own profile
   ```

2. **projects**
   ```sql
   -- Contributors can CRUD all projects
   -- Viewers can read all projects
   ```

3. **analysis_results**
   ```sql
   -- Contributors can CRUD all results
   -- Viewers can read all results
   ```

**Reference Tables:**

4. **prompts**
   ```sql
   -- Contributors can CRUD
   -- Viewers can read
   ```

5. **dropdown_categories & dropdown_values**
   ```sql
   -- Contributors can CRUD
   -- Viewers can read
   ```

6. **Vector tables (project_vector, framework_vector)**
   ```sql
   -- System tables - restrict to service role only
   -- Or allow authenticated read for RAG queries
   ```

### Phase 3: Update Existing RLS Policies

**documents table:**
- Current: Users can only modify their own documents
- New: Contributors can modify documents in any project
- New: Viewers can only read

**framework_materials:**
- Current: Users can only modify their own materials
- New: Contributors can upload/modify materials
- New: Viewers can only read

**app_settings:**
- Current: All authenticated users can update
- New: Only contributors can update
- New: Viewers can read

**analysis_types:**
- Current: Admins can manage, public read
- New: Contributors can manage, viewers & anon can read

**webhooks:**
- Current: Admins can manage, public read
- New: Contributors can manage, all can read

### Phase 4: Storage Bucket Policies

**documents bucket:**
```sql
-- Upload: Contributors only
-- View: All authenticated users
-- Update/Delete: Contributors only
```

**materials bucket:**
```sql
-- Upload: Contributors only
-- View: All authenticated users
-- Update/Delete: Contributors only
```

### Phase 5: Frontend Implementation

**1. Update AuthContext**
```typescript
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  role: 'contributor' | 'viewer' | null;
  isContributor: boolean;
  isViewer: boolean;
  canEdit: boolean; // same as isContributor
}
```

**2. Create Permission Hooks**
```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { role, isContributor } = useAuth();

  return {
    canCreateProject: isContributor,
    canEditProject: isContributor,
    canDeleteProject: isContributor,
    canUploadDocuments: isContributor,
    canRunAnalysis: isContributor,
    canManageSettings: isContributor,
    canManageUsers: isContributor,
    isReadOnly: role === 'viewer',
  };
};
```

**3. Update UI Components**

- **CreateProjectModal**: Hide for viewers
- **ProjectCard**: Hide edit/delete buttons for viewers
- **Dashboard**: Show "View Only" badge for viewers
- **Document Upload**: Disable for viewers
- **Settings**: Restrict to admins
- **Analysis Actions**: Disable "Run Analysis" for viewers

**4. Add Permission Guards**
```typescript
// Wrap sensitive actions
if (!canEditProject) {
  toast.error('You do not have permission to edit projects');
  return;
}
```

**5. Create Role Badge Component**
```typescript
// src/components/RoleBadge.tsx
// Visual indicator of user role throughout app
```

### Phase 6: User Management UI

**Create Settings > Users page** (contributors only)

Features:
- List all users with their roles
- Change user roles between 'contributor' and 'viewer'
- Invite new users with specific roles
- Show last login, email, etc.

## Migration File Structure

```sql
-- 20260218000000-rbac-system.sql

-- Part 1: Update profiles table
-- Part 2: Create helper functions
-- Part 3: Enable RLS on unprotected tables
-- Part 4: Update existing RLS policies
-- Part 5: Update storage policies
-- Part 6: Create admin helper views
```

## Testing Checklist

### Database Tests
- [ ] Contributor can CRUD all tables (projects, documents, materials, etc.)
- [ ] Contributor can run analyses
- [ ] Contributor can manage settings and users
- [ ] Viewer can read all data
- [ ] Viewer cannot create/update/delete anything
- [ ] Viewer cannot run new analyses
- [ ] Users can view their own profile
- [ ] Vector tables are accessible for RAG queries

### Frontend Tests
- [ ] Contributor sees all UI controls (create, edit, delete)
- [ ] Contributor can run analyses
- [ ] Contributor can access Settings and Users page
- [ ] Viewer UI is completely read-only
- [ ] Viewer cannot see create/edit/delete buttons
- [ ] Viewer cannot access Settings or Users pages
- [ ] Appropriate error messages for unauthorized actions
- [ ] Role badges display correctly

### Security Tests
- [ ] Cannot bypass RLS via direct Supabase queries
- [ ] Storage bucket policies enforce correctly
- [ ] Role changes reflect immediately
- [ ] Service role can still perform system operations

## Rollback Plan

If issues arise:
1. Disable RLS on affected tables: `ALTER TABLE x DISABLE ROW LEVEL SECURITY;`
2. Revert migration: Use Supabase migration rollback
3. Restore previous policies from git history

## Notes

- **Backward Compatibility**: Existing 'admin' users will be renamed to 'contributor' automatically
- **Default Role**: New users will default to 'viewer' for security (can be promoted to contributor as needed)
- **Migration Strategy**: Can be done incrementally (one table at a time) or all at once
- **Performance**: RLS policies add minimal overhead, but ensure indexes on `project_id`, `uploader_id` exist
- **Simplicity**: Two-role system is easier to understand and maintain than three-tier hierarchy

## Next Steps

1. Review and approve this plan
2. Create the migration file
3. Test in development environment
4. Update frontend components
5. Create user management interface
6. Deploy to staging
7. Train users on new permission system
8. Deploy to production
