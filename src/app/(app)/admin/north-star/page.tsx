'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, BarChart3, Mic,
  HelpCircle, Users, MessageCircle, CheckCircle, Sparkles, Activity,
  Crown, Shield, Percent, Target,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExperimentSummary {
  id: string;
  name: string;
  status: string;
  metric: string;
  _count: { assignments: number };
  variants: { id: string; name: string; trafficPct: number }[];
  results: { winner: string | null; confidence: number | null; variants: { variantName: string; metricValue: number; userCount: number }[] } | null;
}

interface SegmentMetric {
  label: string;
  count: number;
  matchRate: number;
  messageRate: number;
  d1Retention: number;
  d7Retention: number;
}

interface ActivationSegment {
  steps: string[];
  overall: number[];
  quizTakers: number[];
  voiceIntro: number[];
  verified: number[];
}

interface ExtendedRetentionRow {
  date: string;
  newUsers: number;
  d1: { active: number; rate: number };
  d3: { active: number; rate: number };
  d7: { active: number; rate: number };
  d14: { active: number; rate: number };
  d30: { active: number; rate: number };
}

interface ProductMetrics {
  compatibility: SegmentMetric[];
  voiceIntro: SegmentMetric[];
  dailyQuestion: SegmentMetric[];
  verification: SegmentMetric[];
  activationBySegment: ActivationSegment;
}

export default function NorthStarDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [retention, setRetention] = useState<ExtendedRetentionRow[]>([]);
  const [activationInsights, setActivationInsights] = useState<any>(null);
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/product-metrics?days=30').then(r => r.json()),
      fetch('/api/admin/retention-extended?days=30').then(r => r.json()),
      fetch('/api/admin/activation-insights').then(r => r.json()),
      fetch('/api/admin/experiments').then(r => r.json()),
    ])
      .then(([metricsData, retentionData, activationData, experimentsData]) => {
        setMetrics(metricsData);
        setRetention(retentionData.rows || []);
        setActivationInsights(activationData);
        if (Array.isArray(experimentsData)) setExperiments(experimentsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="md:pl-60 p-6 flex justify-center py-20">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="md:pl-60 p-6">
        <p className="text-muted-foreground">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  return (
    <div className="md:pl-60 p-6 space-y-6 bg-muted/30 min-h-screen">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">North Star</h1>
          <p className="text-sm text-muted-foreground">Métricas de producto e impacto de features</p>
        </div>
      </div>

      {/* Compatibility Impact */}
      <MetricComparisonCard
        title="Impacto Quiz de Compatibilidad"
        icon={BarChart3}
        iconColor="text-indigo-500"
        iconBg="bg-indigo-100"
        metrics={metrics.compatibility}
      />

      {/* Voice Intro Impact */}
      <MetricComparisonCard
        title="Impacto Intro de Voz"
        icon={Mic}
        iconColor="text-pink-500"
        iconBg="bg-pink-100"
        metrics={metrics.voiceIntro}
      />

      {/* Daily Question Impact */}
      <MetricComparisonCard
        title="Impacto Pregunta Diaria"
        icon={HelpCircle}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-100"
        metrics={metrics.dailyQuestion}
      />

      {/* Verification Impact */}
      <MetricComparisonCard
        title="Impacto Verificación"
        icon={Sparkles}
        iconColor="text-amber-500"
        iconBg="bg-amber-100"
        metrics={metrics.verification}
      />

      {/* Activation Distribution */}
      {activationInsights?.activation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Activación (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-2">
                <p className="text-lg font-bold text-green-600">{activationInsights.activation.rate}%</p>
                <p className="text-xs text-muted-foreground">Tasa activación</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold">{activationInsights.activation.profilesWithPhotos}</p>
                <p className="text-xs text-muted-foreground">Con fotos</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold">{activationInsights.activation.profilesWithBio}</p>
                <p className="text-xs text-muted-foreground">Con bio</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold">{activationInsights.activation.profilesWithInterest}</p>
                <p className="text-xs text-muted-foreground">Con intereses</p>
              </div>
              <div className="text-center p-2">
                <p className="text-lg font-bold">{activationInsights.activation.profilesWithValues}</p>
                <p className="text-xs text-muted-foreground">Con valores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Stats */}
      {activationInsights?.features && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Adopción de Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Voice intro', value: activationInsights.features.voiceIntroRate, icon: Mic, color: 'text-pink-500', bg: 'bg-pink-100' },
                { label: 'Verificación', value: activationInsights.features.verificationRate, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-100' },
                { label: 'Quiz completado', value: activationInsights.features.quizCompletionRate, icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-100' },
                { label: 'Pregunta diaria', value: activationInsights.features.dailyQuestionRate, icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-100' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="text-center p-3 rounded-xl bg-muted/50">
                    <div className={`inline-flex p-1.5 ${f.bg} rounded-lg mb-2`}>
                      <Icon className={`h-4 w-4 ${f.color}`} />
                    </div>
                    <p className="text-xl font-bold">{f.value}%</p>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activation by Segment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Embudo por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Paso</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">General</th>
                  <th className="text-right py-2 px-3 font-medium text-indigo-600">Quiz</th>
                  <th className="text-right py-2 px-3 font-medium text-pink-600">Voz</th>
                  <th className="text-right py-2 px-3 font-medium text-amber-600">Verif.</th>
                </tr>
              </thead>
              <tbody>
                {metrics.activationBySegment.steps.map((step, i) => (
                  <tr key={step} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{step}</td>
                    <td className="text-right py-2 px-3">{metrics.activationBySegment.overall[i]?.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-indigo-600">{metrics.activationBySegment.quizTakers[i]?.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-pink-600">{metrics.activationBySegment.voiceIntro[i]?.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 text-amber-600">{metrics.activationBySegment.verified[i]?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Running Experiments */}
      {experiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Experimentos Activos ({experiments.filter(e => e.status === 'running').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {experiments.filter(e => e.status === 'running').slice(0, 4).map(exp => {
                const best = exp.results?.variants?.reduce((a, b) => a.metricValue > b.metricValue ? a : b);
                return (
                  <div key={exp.id} className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold">{exp.name}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {exp._count.assignments} users
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Métrica: {exp.metric}</p>
                    {best && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-purple-600 font-medium">Lider: {best.variantName}</span>
                        <span className="text-muted-foreground">({best.metricValue})</span>
                        {exp.results?.winner && exp.results.confidence && exp.results.confidence > 80 && (
                          <span className="text-green-600 font-bold">🏆 Ganador</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push('/admin/experiments')}
              className="mt-3 text-xs text-purple-600 font-medium hover:underline"
            >
              Gestionar experimentos →
            </button>
          </CardContent>
        </Card>
      )}

      {/* Extended Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Retención Extendida (30d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {retention.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos de retención en este período</p>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {['D1', 'D3', 'D7', 'D14', 'D30'].map((label, i) => {
                  const latest = retention[retention.length - 1];
                  const key = label.toLowerCase() as keyof typeof latest;
                  const val = latest[key] as { active: number; rate: number };
                  const colors = [
                    'from-blue-500 to-cyan-500',
                    'from-cyan-500 to-teal-500',
                    'from-teal-500 to-green-500',
                    'from-green-500 to-yellow-500',
                    'from-yellow-500 to-orange-500',
                  ];
                  return (
                    <div key={label} className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${colors[i]} bg-clip-text text-transparent`}>
                        {val.rate}%
                      </p>
                      <p className="text-xs text-muted-foreground">{val.active} users</p>
                    </div>
                  );
                })}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Nuevos</th>
                      <th className="text-right py-2 px-2 font-medium text-blue-600">D1</th>
                      <th className="text-right py-2 px-2 font-medium text-teal-600">D3</th>
                      <th className="text-right py-2 px-2 font-medium text-green-600">D7</th>
                      <th className="text-right py-2 px-2 font-medium text-yellow-600">D14</th>
                      <th className="text-right py-2 px-2 font-medium text-orange-600">D30</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.map((row) => (
                      <tr key={row.date} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-1.5 pr-4 text-muted-foreground">{row.date}</td>
                        <td className="text-right py-1.5 px-2">{row.newUsers}</td>
                        <td className="text-right py-1.5 px-2">{row.d1.rate}%</td>
                        <td className="text-right py-1.5 px-2">{row.d3.rate}%</td>
                        <td className="text-right py-1.5 px-2">{row.d7.rate}%</td>
                        <td className="text-right py-1.5 px-2">{row.d14.rate}%</td>
                        <td className="text-right py-1.5 px-2">{row.d30.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricComparisonCard({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  metrics,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  metrics: SegmentMetric[];
}) {
  const a = metrics[0];
  const b = metrics[1];
  if (!a || !b) return null;

  const diff = (val: number, other: number) => {
    if (other === 0) return Infinity;
    return Math.round(((val - other) / other) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className={`p-1.5 ${iconBg} rounded-lg`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {[a, b].map((m) => (
            <div key={m.label} className={`p-3 rounded-xl ${m.label === a.label ? 'bg-primary/5 border border-primary/10' : 'bg-muted/50'}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{m.label}</p>
              <p className="text-2xl font-bold mb-1">{m.count.toLocaleString()}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match rate</span>
                  <span className="font-medium">{m.matchRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mensajes/user</span>
                  <span className="font-medium">{m.messageRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ret. D1</span>
                  <span className="font-medium">{m.d1Retention}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ret. D7</span>
                  <span className="font-medium">{m.d7Retention}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: 'Match rate', val: diff(a.matchRate, b.matchRate) },
            { label: 'Mensajes/user', val: diff(a.messageRate, b.messageRate) },
            { label: 'Ret. D1', val: diff(a.d1Retention, b.d1Retention) },
            { label: 'Ret. D7', val: diff(a.d7Retention, b.d7Retention) },
          ].map((d) => {
            const isPositive = d.val > 0;
            return (
              <div key={d.label} className="text-center p-2 bg-background rounded-lg border">
                <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : d.val < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {d.val === Infinity ? '∞' : isPositive ? `+${d.val}%` : `${d.val}%`}
                </p>
                <p className="text-xs text-muted-foreground">{d.label}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
