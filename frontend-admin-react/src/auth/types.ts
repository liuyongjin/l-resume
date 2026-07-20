export interface AdminMenu {
  id: number;
  parentId: number;
  name: string;
  type: 'directory' | 'menu' | 'button' | string;
  path?: string | null;
  component?: string | null;
  permission?: string | null;
  icon?: string | null;
  sortOrder?: number;
  visible?: boolean;
  status?: string;
  children?: AdminMenu[];
}

export interface MeData {
  username: string;
  nickname?: string | null;
  roles: string[];
  permissions: string[];
  menus: AdminMenu[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
  };
}
