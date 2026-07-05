'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';

const CATEGORIES = [
    { value: 'account', label: 'Cuenta o Perfil' },
    { value: 'report', label: 'Reporte de comportamiento' },
    { value: 'subscription', label: 'Suscripción o pago' },
    { value: 'suggestion', label: 'Sugerencia de mejora' },
    { value: 'technical', label: 'Problema técnico' },
    { value: 'other', label: 'Otro' },
];

const SUPPORT_EMAIL = 'soporte.alora.app@gmail.com';

export default function ContactPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [category, setCategory] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = name.trim() && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && category && message.trim().length >= 10;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setSending(true);
        setError(null);

        const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
        const subject = encodeURIComponent(`[Alora Soporte] ${categoryLabel} — ${name.trim()}`);
        const body = encodeURIComponent(
            `Nombre: ${name.trim()}\n` +
            `Email: ${email.trim()}\n` +
            `Categoría: ${categoryLabel}\n\n` +
            `${message.trim()}\n\n` +
            `---\nEnviado desde Alora App`
        );
        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

        try {
            // Try opening email client
            const link = document.createElement('a');
            link.href = mailtoUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Wait a moment to see if mailto worked
            await new Promise(resolve => setTimeout(resolve, 500));
            setSent(true);
        } catch {
            // Fallback: show email for manual copy
            setError('No se pudo abrir el cliente de email. Copia la dirección y envía el mensaje manualmente.');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-dvh bg-gradient-to-br from-background to-muted/30">
                <PageHeader title="Contacto" onBack={() => { if (window.history.length > 1) router.back(); else router.push('/'); }} />
                <main className="max-w-lg mx-auto p-6 space-y-6">
                    <Card className="rounded-3xl">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Mensaje preparado</h2>
                                    <p className="text-sm text-muted-foreground">Se abrió tu cliente de email</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>Tu mensaje fue preparado y se abrió en tu aplicación de correo.</p>
                                <p>Si no se abrió automáticamente, envía un email a:</p>
                                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-bold hover:underline break-all">
                                    {SUPPORT_EMAIL}
                                </a>
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => { setSent(false); setName(''); setEmail(''); setCategory(''); setMessage(''); }}>
                                Enviar otro mensaje
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-gradient-to-br from-background to-muted/30">
            <PageHeader title="Contacto" onBack={() => { if (window.history.length > 1) router.back(); else router.push('/'); }} />

            <main className="max-w-lg mx-auto p-6 space-y-6">
                {error && (
                    <Alert variant="destructive" role="alert">
                        <AlertDescription className="space-y-2">
                            <p>{error}</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4" aria-hidden="true" />
                                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-bold hover:underline break-all">
                                    {SUPPORT_EMAIL}
                                </a>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => navigator.clipboard.writeText(SUPPORT_EMAIL)}
                                >
                                    Copiar
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setError(null)}>Cerrar</Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="rounded-3xl">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20">
                                    <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Soporte de Alora</h2>
                                    <p className="text-sm text-muted-foreground">Estamos aquí para ayudarte</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-name">Nombre</Label>
                                <Input
                                    id="contact-name"
                                    placeholder="Tu nombre"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-email">Email</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    placeholder="tu@ejemplo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-category">Categoría</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="contact-category">
                                        <SelectValue placeholder="Selecciona un tema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contact-message">
                                    Mensaje
                                    <span className="text-muted-foreground text-xs ml-1">({message.length}/1000)</span>
                                </Label>
                                <Textarea
                                    id="contact-message"
                                    placeholder="Describe tu problema o sugerencia..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value.slice(0, 1000))}
                                    required
                                    minLength={10}
                                    rows={5}
                                    className="resize-none"
                                />
                                {message.length > 0 && message.length < 10 && (
                                    <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={!isValid || sending}>
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar mensaje
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <h3 className="font-bold text-sm">¿Qué podemos ayudarte con?</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Problemas con tu cuenta o perfil</li>
                        <li>• Reportes de comportamiento inapropiado</li>
                        <li>• Dudas sobre tu suscripción</li>
                        <li>• Sugerencias de mejora</li>
                        <li>• Problemas técnicos</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
