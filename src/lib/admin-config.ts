/**
 * Alora — Configuración de administración
 *
 * Solo el correo oficial puede acceder al panel de administración.
 * El correo NO es un secreto y puede usarse en el cliente para validar
 * el login exclusivo de administradores. La contraseña jamás se expone
 * aquí: vive únicamente en las variables de entorno del servidor y en
 * Supabase Auth.
 */

export const ADMIN_EMAIL = 'soporte.alora.app@gmail.com';

/** Roles que tienen acceso total al panel de administración. */
export const ADMIN_ROLES = ['admin', 'super_admin'] as const;

export function isAdminRole(role: string | null | undefined): boolean {
    if (!role) return false;
    return (ADMIN_ROLES as readonly string[]).includes(role);
}
