"use client";

export const dynamic = 'force-dynamic';

import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Shield, Users, Flag, BarChart3, Beaker, Zap, Heart, Rocket, Target, BookOpen, BarChart } from "lucide-react";

const MODULES = [
  { href: "/admin/users", label: "Gestión de Usuarios", icon: Users, desc: "Ban, shadowban, verificar usuarios" },
  { href: "/admin/reports", label: "Reportes", icon: Flag, desc: "Gestionar reportes de usuarios" },
  { href: "/admin/verifications", label: "Verificaciones", icon: Shield, desc: "Aprobar/rechazar identificaciones" },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3, desc: "DAU/WAU/MAU, funnel, retención" },
  { href: "/admin/experiments", label: "Experimentos", icon: Beaker, desc: "A/B tests y feature flags" },
  { href: "/admin/activation", label: "Activación", icon: Zap, desc: "Funnel de activación y métricas" },
  { href: "/admin/match-quality", label: "Calidad de Matches", icon: Heart, desc: "Engagement, ghosting, respuesta" },
  { href: "/admin/marketplace-command", label: "Mercado", icon: BarChart, desc: "Salud del marketplace" },
  { href: "/admin/go-no-go", label: "Go/No-Go", icon: Rocket, desc: "Criterios de lanzamiento" },
  { href: "/admin/women-strategy", label: "Estrategia Mujeres", icon: Target, desc: "Retención femenina" },
  { href: "/admin/success-stories", label: "Historias de Éxito", icon: BookOpen, desc: "CRUD de testimonios" },
  { href: "/admin/north-star", label: "North Star", icon: BarChart, desc: "Métricas principales del producto" },
] as const;

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground mb-8">Selecciona un módulo para gestionar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="p-4 hover:bg-accent transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <mod.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{mod.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
