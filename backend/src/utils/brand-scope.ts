import { UserRole } from '../constants/enums';
import type { AuthUserLike } from './staff';

export function resolveStaffBrandId(authUser: AuthUserLike | undefined, query: { brandId?: string }): number {
  if (!authUser) return 1;
  if (authUser.role === UserRole.SUPER_ADMIN) {
    const raw = query?.brandId;
    if (raw == null || raw === '') return 1;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : 1;
  }
  if (authUser.brandId != null) return authUser.brandId;
  return 1;
}

export function isSuperAdmin(authUser: AuthUserLike | undefined): boolean {
  return authUser?.role === UserRole.SUPER_ADMIN;
}
