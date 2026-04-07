import { UserRole } from '../constants/enums';

export type AuthUserLike = { role: string; brandId?: number | null };

export function isStaffFromAuth(authUser: AuthUserLike | undefined): boolean {
  if (!authUser) return false;
  const r = authUser.role;
  return r === UserRole.ADMIN || r === UserRole.MANAGER || r === UserRole.SUPER_ADMIN;
}
