export class ContentFilterService {
    private static BLOCKED_PATTERNS = [
        /\b(put[ao]|mierda|pendej[ao]|cabr[oó]n|culiao|ctm|conchetumadre|hij[ao] de puta|chinga tu madre)\b/i,
        /\b(odio|muérete|mátate|tonta|tarado|imb[ée]cil|estúpid[ao])\b/i,
        /\b(transferencia|wester.?union|money.?gram|bitcoin|crypto|inversi[oó]n|gana dinero f[áa]cil)\b/i,
        /\b(envíame|mándame|deposita|préstame|necesito \$|me urge dinero|pr[ée]stamo)\b/i,
    ];

    private static SENSITIVE_PATTERNS = [
        /\b(tel[eé]fono|whatsapp|instagram|snapchat|facebook|celular|llámame)\b/i,
        /\b(direcci[oó]n|vivo en|mi casa|domicilio|colonia)\b/i,
    ];

    static filterContent(text: string): { clean: string; blocked: boolean; sensitive: string[] } {
        let clean = text;
        let blocked = false;
        const sensitive: string[] = [];

        for (const p of this.BLOCKED_PATTERNS) {
            if (p.test(clean)) {
                blocked = true;
                clean = clean.replace(p, '***');
            }
        }

        for (const p of this.SENSITIVE_PATTERNS) {
            const match = clean.match(p);
            if (match) {
                sensitive.push(match[0]);
                clean = clean.replace(p, '***');
            }
        }

        return { clean, blocked, sensitive };
    }

    static isContentSafe(text: string): { safe: boolean; reason?: string } {
        for (const p of this.BLOCKED_PATTERNS) {
            if (p.test(text)) {
                return { safe: false, reason: 'Contenido bloqueado detectado' };
            }
        }
        return { safe: true };
    }
}
