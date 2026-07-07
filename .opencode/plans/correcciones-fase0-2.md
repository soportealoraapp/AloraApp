# Plan de Correcciones Alora — Fases 0-2

## FASE 0: EMERGENCIA (Día 1)

### 1. Fix: LikesCounter div-by-zero
**Archivo:** `src/components/discover/LikesCounter.tsx`
**Línea:** 61
**Cambio:**
```tsx
// ANTES:
const percentage = isPlus ? 100 : Math.round((remaining / dailyLikesLimit) * 100);

// DESPUÉS:
const percentage = isPlus ? 100 : dailyLikesLimit > 0 ? Math.round((remaining / dailyLikesLimit) * 100) : 0;
```

### 2. Fix: LikesCounter threshold relativo
**Archivo:** `src/components/discover/LikesCounter.tsx`
**Línea:** 83
**Cambio:**
```tsx
// ANTES:
const isLow = remaining <= 10;

// DESPUÉS:
const isLow = remaining <= Math.max(10, Math.floor(dailyLikesLimit * 0.15));
```

### 3. Fix: DailyAnswersModal crash por currentAnswer undefined
**Archivo:** `src/components/daily-question/DailyAnswersModal.tsx`
**Línea:** 78 (agregar después)
**Cambio:** Agregar guard después de la línea 78:
```tsx
const currentAnswer = answers[currentIndex];

// AGREGAR DESPUÉS:
if (!currentAnswer) return null;
```

### 4. Fix: DailyQuestionCard crash por answerItem undefined
**Archivo:** `src/components/daily-question/DailyQuestionCard.tsx`
**Líneas:** 322-324
**Cambio:**
```tsx
// ANTES:
onLike={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'like')}
onSuperlike={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'superlike')}
onPass={(userId) => handleAction(otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId), 'pass')}

// DESPUÉS:
onLike={(userId) => { const answer = otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId); if (answer) handleAction(answer, 'like'); }}
onSuperlike={(userId) => { const answer = otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId); if (answer) handleAction(answer, 'superlike'); }}
onPass={(userId) => { const answer = otherAnswers.find(a => a.userId === userId || a.profile?.userId === userId); if (answer) handleAction(answer, 'pass'); }}
```

### 5. Fix: Lat/Long 0 tratado como null
**Archivo:** `src/app/(app)/profile/edit/page.tsx`
**Líneas:** 100-101
**Cambio:**
```tsx
// ANTES:
setLatitude(currentProfile.latitude || null);
setLongitude(currentProfile.longitude || null);

// DESPUÉS:
setLatitude(currentProfile.latitude ?? null);
setLongitude(currentProfile.longitude ?? null);
```

### 6. Fix: Religion options override
**Archivo:** `src/app/(app)/profile/edit/page.tsx`
**Líneas:** 26-31
**Cambio:**
```tsx
// ANTES:
const lifestyleOptions = {
    smoking: [...LIFESTYLE_OPTIONS.smoking],
    drinking: [...LIFESTYLE_OPTIONS.drinking],
    children: [...LIFESTYLE_OPTIONS.children],
    religion: ["Ninguna", "Cristiana", "Católica", "Musulmana", "Judía", "Budista", "Otra"],
};

// DESPUÉS:
const lifestyleOptions = {
    smoking: [...LIFESTYLE_OPTIONS.smoking],
    drinking: [...LIFESTYLE_OPTIONS.drinking],
    children: [...LIFESTYLE_OPTIONS.children],
    religion: [...LIFESTYLE_OPTIONS.religion],
};
```

### 7. Fix: "visitó" → "visitaron"
**Archivo:** `src/app/(app)/profile/visitors/page.tsx`
**Línea:** ~79
**Cambio:**
```tsx
// ANTES:
{total} persona{total !== 1 ? 's' : ''} visitó tu perfil

// DESPUÉS:
{total} persona{total !== 1 ? 's' : ''} visitaron tu perfil
```

### 8. Fix: Pluralización "1 personas"
**Archivo:** `src/components/match/LikesReceivedList.tsx`
**Línea:** ~57
**Cambio:**
```tsx
// ANTES:
Le gustas a {likers.length} personas

// DESPUÉS:
Le gustas a {likers.length} {likers.length === 1 ? 'persona' : 'personas'}
```

### 9. Fix: "Aun" → "Aún"
**Archivo:** `src/components/match/LikesReceivedList.tsx`
**Línea:** ~64
**Cambio:**
```tsx
// ANTES:
Aun no tienes nuevos admiradores

// DESPUÉS:
Aún no tienes nuevos admiradores
```

### 10. Fix: Gendered copy "ella"
**Archivo:** `src/app/(app)/chat/[id]/page.tsx`
**Líneas:** ~248-249, 572-573
**Cambios:**
```tsx
// ANTES (línea ~249):
En conexiones entre hombres y mujeres, ella envía el primer mensaje.

// DESPUÉS:
En conexiones entre personas de diferente género, una persona da el primer paso.

// ANTES (línea ~572):
En Alora, ella da el primer paso.

// DESPUÉS:
En Alora, una persona da el primer paso.
```

### 11-18. Fix: r.ok checks en fetch calls
Agregar `if (!res.ok) throw new Error('Failed to fetch');` antes de `.json()` en:

**Archivo:** `src/components/discover/LikesSentSection.tsx` (~línea 37)
```tsx
// ANTES:
.then(r => r.json())

// DESPUÉS:
.then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
```

**Archivo:** `src/components/discover/SecondChanceSection.tsx` (~línea 37)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/components/compatibility/DailyCompatibilityCard.tsx` (~línea 40)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/components/match/LikesReceivedList.tsx` (~línea 37)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/components/chat/MatchTimeline.tsx` (~línea 35)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/app/(app)/profile/page.tsx` (~líneas 46, 63)
```tsx
// MISMO CAMBIO en ambos fetch
```

**Archivo:** `src/app/(app)/profile/favorites/page.tsx` (~línea 37)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/app/(app)/profile/visitors/page.tsx` (~línea 39)
```tsx
// MISMO CAMBIO
```

**Archivo:** `src/app/(app)/profile/trust/page.tsx` (~línea 45)
```tsx
// MISMO CAMBIO
```

---

## FASE 1: SEGURIDAD & COMPLIANCE (Días 2-3)

### 19. Fix: Auth callback cookie security
**Archivo:** `src/app/auth/callback/route.ts`
**Líneas:** 60-61
**Cambio:**
```tsx
// ANTES:
response.headers.set('Set-Cookie', `alora_referral=; path=/; max-age=0`);

// DESPUÉS:
response.headers.set('Set-Cookie', `alora_referral=; path=/; max-age=0; httpOnly; secure; samesite=lax`);
```

### 20. Fix: Signup referral cookie httpOnly
**Archivo:** `src/app/(auth)/signup/page.tsx`
**Línea:** ~21
**Cambio:**
```tsx
// ANTES:
cookies().set('alora_referral', referralCode, { httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });

// DESPUÉS:
cookies().set('alora_referral', referralCode, { httpOnly: true, secure: true, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
```

### 21. Fix: Password minimum length
**Archivo:** `src/app/(app)/settings/privacy/page.tsx`
**Línea:** ~50
**Cambio:**
```tsx
// ANTES:
if (newPassword.length < 6) {

// DESPUÉS:
if (newPassword.length < 8) {
```

### 22. Fix: Open redirect en notifications
**Archivo:** `src/app/(app)/notifications/page.tsx`
**Líneas:** 54-56
**Cambio:**
```tsx
// ANTES:
if (data.screen && typeof data.screen === 'string' && data.screen.startsWith('/') && !data.screen.startsWith('//')) {
    router.push(data.screen);
}

// DESPUÉS:
const ALLOWED_SCREENS = ['/discover', '/matches', '/chat', '/profile', '/notifications', '/settings', '/compatibility', '/refer'];
if (data.screen && typeof data.screen === 'string' && data.screen.startsWith('/') && !data.screen.startsWith('//') && ALLOWED_SCREENS.some(s => data.screen.startsWith(s))) {
    router.push(data.screen);
}
```

### 23. Fix: CSV escaping
**Archivo:** `src/app/(app)/admin/metrics/page.tsx`
**Líneas:** 49-78
**Cambio:** Agregar función helper y usarla:
```tsx
// AGREGAR al inicio del archivo (después de imports):
function escapeCSV(val: string | number): string {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// CAMBIAR en exportCSV:
const csv = rows.map(r => r.map(escapeCSV).join(',')).join('\n');
```

### 24. Fix: Favorites retry sin reload
**Archivo:** `src/app/(app)/profile/favorites/page.tsx`
**Línea:** ~75
**Cambio:**
```tsx
// ANTES:
onClick={() => window.location.reload()}

// DESPUÉS:
onClick={() => { setError(null); setLoading(true); fetchFavorites(); }}
```

### 25. Fix: Notifications settings error state
**Archivo:** `src/app/(app)/settings/notifications/page.tsx`
**Línea:** ~36-49
**Cambio:** Agregar state de error:
```tsx
// AGREGAR después de const [prefs, setPrefs]:
const [error, setError] = useState(false);

// EN fetchPreferences, cambiar catch:
} catch (error) {
    console.error('Error fetching notification preferences:', error);
    setError(true);
} finally {
    setLoading(false);
}

// EN render, agregar check después de loading:
if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-sm text-muted-foreground">Error al cargar preferencias</p>
            <Button size="sm" variant="outline" onClick={() => { setError(false); fetchPreferences(); }}>
                Reintentar
            </Button>
        </div>
    );
}
```

### 26. Fix: Blocked users error state
**Archivo:** `src/app/(app)/settings/privacy/blocked/page.tsx`
**Cambio:** Agregar state de error y distinguishir de empty state.

### 27. Fix: Travel mode header + error state
**Archivo:** `src/app/(app)/settings/travel/page.tsx`
**Líneas:** 121-127
**Cambio:** Agregar header con back button durante loading.

### 28. Fix: Visitors loadMore try/catch/finally
**Archivo:** `src/app/(app)/profile/visitors/page.tsx`
**Líneas:** 60-64
**Cambio:**
```tsx
// ANTES:
const loadMore = async () => {
    setLoadingMore(true);
    await fetchVisitors(visitors.length, true);
    setLoadingMore(false);
};

// DESPUÉS:
const loadMore = async () => {
    setLoadingMore(true);
    try {
        await fetchVisitors(visitors.length, true);
    } finally {
        setLoadingMore(false);
    }
};
```

### 29. Fix: Unblock confirmation dialog
**Archivo:** `src/app/(app)/settings/privacy/blocked/page.tsx`
**Cambio:** Agregar AlertDialog antes de unblock.

### 30. Fix: Verification approve/reject confirmation
**Archivo:** `src/app/(app)/admin/verifications/page.tsx`
**Cambio:** Agregar estado `pendingAction` y AlertDialog.

---

## FASE 2: UX CRÍTICA (Días 4-5)

### 31. Fix: Admin reports fake text
**Archivo:** `src/app/(app)/admin/reports/page.tsx`
**Línea:** ~182
**Cambio:**
```tsx
// ANTES:
<div className="text-xs text-muted-foreground/60 mt-1">
    Reportado por usuario verificado
</div>

// DESPUÉS:
// Eliminar esta línea completamente, o reemplazar con:
<div className="text-xs text-muted-foreground/60 mt-1">
    Reportado por usuario {report.reporter?.isVerified ? 'verificado' : 'no verificado'}
</div>
```

### 32. Fix: Profile "Top 10%" claim
**Archivo:** `src/app/(app)/profile/page.tsx`
**Línea:** ~374
**Cambio:**
```tsx
// ANTES:
<p className="text-xs text-muted-foreground">Tu perfil está en el top 10% de completitud</p>

// DESPUÉS:
<p className="text-xs text-muted-foreground">Tu perfil está entre los más completos</p>
```

### 33. Fix: Safety conditional card
**Archivo:** `src/app/(app)/settings/safety/page.tsx`
**Línea:** ~93
**Cambio:**
```tsx
// ANTES:
<p className="font-bold text-foreground">Tu cuenta esta segura</p>

// DESPUÉS:
<p className="font-bold text-foreground">
    {profile?.isVerified ? 'Tu cuenta está verificada y segura' : 'Tu cuenta está activa'}
</p>
```

### 34-45. Fix: Admin back buttons — Crear componente compartido
**Archivo nuevo:** `src/components/admin/AdminBackButton.tsx`
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function AdminBackButton() {
    const router = useRouter();
    return (
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}
```

Reemplazar en: activation, experiments, go-no-go, marketplace-command, match-quality, metrics, north-star, reports, success-stories, users, verifications, women-strategy.

### 46-51. Fix: Admin refresh buttons
Agregar botón de refresh a páginas sin refresh.

### 52-55. Fix: Admin toast feedback
Agregar toast de éxito/error a actions en experiments, reports, verifications, users.

### 56. Fix: Contact form deception
**Archivo:** `src/app/contact/page.tsx`
**Cambio:** Eliminar spinner falso, cambiar copy a "Abrir cliente de email".

### 57. Fix: Password update recovery flow
**Archivo:** `src/app/(auth)/password-update/page.tsx`
**Cambio:** Verificar tipo de sesión y manejar recovery tokens.

### 58-59. Fix: ARIA labels
Agregar `aria-label="Volver"` a back buttons faltantes en notifications/settings.

### 60. Fix: Login form aria-invalid
**Archivo:** `src/app/(auth)/login/page.tsx`
**Cambio:** Agregar `aria-invalid={!!error}` y `aria-describedby` a inputs.

---

## VERIFICACIÓN

Después de cada fase, ejecutar:
```bash
npm run typecheck
npm run lint
```

Para verificar que no se introdujeron errores de tipos o de linting.
