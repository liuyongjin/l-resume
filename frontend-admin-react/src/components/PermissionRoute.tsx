import { useAuth } from '../auth/AuthContext';

export function PermissionRoute({
  permission,
  children,
}: {
  permission?: string;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  if (permission && !hasPermission(permission)) {
    return (
      <div>
        <h1 className="page-title">无权限</h1>
        <p className="muted">当前账号没有访问此页面的权限（{permission}）。</p>
      </div>
    );
  }

  return <>{children}</>;
}
