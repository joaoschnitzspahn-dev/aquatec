import type { Permission, Role, User } from "@/lib/data/types";
import { ROLE_PERMISSIONS } from "@/lib/data/types";

export function getUserPermissions(user: User): Permission[] {
  if (user.role === "MASTER") return ROLE_PERMISSIONS.MASTER;
  if (user.role === "CUSTOM") return user.customPermissions;
  return [...ROLE_PERMISSIONS.EMPLOYEE, ...user.customPermissions];
}

export function can(user: User, permission: Permission): boolean {
  return getUserPermissions(user).includes(permission);
}

export function assertCan(user: User, permission: Permission) {
  if (!can(user, permission)) {
    throw new Error("Sem permissão para esta ação.");
  }
}

export function isMaster(user: User) {
  return user.role === "MASTER";
}

export function roleLabel(role: Role) {
  switch (role) {
    case "MASTER":
      return "Administrador";
    case "EMPLOYEE":
      return "Funcionário";
    case "CUSTOM":
      return "Personalizado";
  }
}
