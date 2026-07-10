/**
 * Alora — Setup del usuario administrador
 *
 * Crea (o actualiza) el único usuario administrador oficial en Supabase Auth
 * y en la base de datos (Prisma), asignándole el rol `super_admin` para darle
 * acceso total al panel de administración.
 *
 * La contraseña se lee de la variable ADMIN_PASSWORD (en .env, ya gitignoreado)
 * y NUNCA se imprime en la consola ni se expone al cliente.
 *
 * Uso:  npx tsx scripts/setup-admin.ts
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// --- Cargar .env manualmente (el repo no usa dotenv en scripts) ---
function loadEnv() {
    const envPath = resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) return;
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

loadEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'soporte.alora.app@gmail.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function generateStrongPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    const bytes = new Uint8Array(32);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        globalThis.crypto.getRandomValues(bytes);
    } else {
        const nodeCrypto = require('node:crypto');
        nodeCrypto.randomFillSync(bytes);
    }
    let out = '';
    for (let i = 0; i < 28; i++) out += chars[bytes[i] % chars.length];
    return out;
}

async function ensurePasswordInEnv(): Promise<string> {
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12) {
        return process.env.ADMIN_PASSWORD;
    }
    const pw = generateStrongPassword();
    const envPath = resolve(process.cwd(), '.env');
    appendFileSync(envPath, `\nADMIN_PASSWORD="${pw}"\n`, 'utf8');
    process.env.ADMIN_PASSWORD = pw;
    console.log('[setup-admin] Se generó una contraseña fuerte y se guardó en .env (no se muestra aquí).');
    return pw;
}

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        throw new Error(
            'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.',
        );
    }

    const password = await ensurePasswordInEnv();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const prisma = new PrismaClient();

    try {
        // 1) ¿Ya existe el usuario en la BD?
        const existingDbUser = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL },
            select: { id: true },
        });

        let authUserId = existingDbUser?.id;

        if (authUserId) {
            // Verificar si existe en Supabase Auth
            const { data: existingAuth } = await supabase.auth.admin.getUserById(authUserId);
            if (existingAuth.user) {
                const { error } = await supabase.auth.admin.updateUserById(authUserId, {
                    password,
                    email_confirm: true,
                });
                if (error) throw new Error(`Error actualizando auth: ${error.message}`);
                console.log('[setup-admin] Usuario auth existente actualizado.');
            } else {
                const { data: created, error } = await supabase.auth.admin.createUser({
                    id: authUserId,
                    email: ADMIN_EMAIL,
                    password,
                    email_confirm: true,
                });
                if (error) throw new Error(`Error creando auth: ${error.message}`);
                authUserId = created.user.id;
                console.log('[setup-admin] Usuario auth creado con id existente de BD.');
            }
        } else {
            const { data: created, error } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password,
                email_confirm: true,
            });
            if (error) throw new Error(`Error creando auth: ${error.message}`);
            authUserId = created.user.id;
            console.log('[setup-admin] Usuario auth creado.');
        }

        // 2) Sincronizar fila en Prisma (User + Profile)
        await prisma.user.upsert({
            where: { id: authUserId },
            update: { role: 'super_admin', email: ADMIN_EMAIL, isActive: true },
            create: {
                id: authUserId,
                email: ADMIN_EMAIL,
                name: 'Alora Admin',
                role: 'super_admin',
                isActive: true,
            },
        });

        await prisma.profile.upsert({
            where: { userId: authUserId },
            update: { isCompleted: true, displayName: 'Alora Admin' },
            create: {
                userId: authUserId,
                displayName: 'Alora Admin',
                isCompleted: true,
                isVerified: true,
            },
        });

        // 3) Auditoría
        await prisma.auditLog.create({
            data: {
                userId: authUserId,
                action: 'admin_setup',
                details: { email: ADMIN_EMAIL, role: 'super_admin' },
            },
        });

        console.log(`[setup-admin] ✅ Administrador listo: ${ADMIN_EMAIL} (rol super_admin)`);
        console.log('[setup-admin] Inicia sesión en /admin/login con este correo y la contraseña de .env.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('[setup-admin] ❌', err.message || err);
    process.exit(1);
});
