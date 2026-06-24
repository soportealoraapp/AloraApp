'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Plus, Play, Pause, CheckCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Variant {
  id: string;
  name: string;
  trafficPct: number;
}

interface VariantResult {
  variantName: string;
  userCount: number;
  metricValue: number;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: string;
  metric: string;
  createdAt: string;
  variants: Variant[];
  _count: { assignments: number };
  results: {
    winner: string | null;
    confidence: number | null;
    variants: VariantResult[];
  } | null;
}

export default function AdminExperimentsPage() {
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMetric, setNewMetric] = useState('activation_rate');
  const [newVariants, setNewVariants] = useState([
    { name: 'control', trafficPct: 50 },
    { name: 'treatment', trafficPct: 50 },
  ]);
  const [saving, setSaving] = useState(false);

  const loadExperiments = async () => {
    try {
      const res = await fetch('/api/admin/experiments');
      if (res.ok) setExperiments(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExperiments(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/experiments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadExperiments();
    } catch (e) { console.error(e); }
  };

  const deleteExperiment = async (id: string) => {
    if (!confirm('¿Eliminar este experimento? Se borrarán todas las asignaciones.')) return;
    try {
      const res = await fetch(`/api/admin/experiments/${id}`, { method: 'DELETE' });
      if (res.ok) loadExperiments();
    } catch (e) { console.error(e); }
  };

  const createExperiment = async () => {
    if (!newName || newVariants.length < 2) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
          metric: newMetric,
          variants: newVariants,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName('');
        setNewDescription('');
        setNewMetric('activation_rate');
        setNewVariants([{ name: 'control', trafficPct: 50 }, { name: 'treatment', trafficPct: 50 }]);
        loadExperiments();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="md:pl-60 p-6 flex justify-center py-20">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="md:pl-60 p-6 space-y-6 min-h-dvh">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Experimentos</h1>
            <p className="text-sm text-muted-foreground">A/B testing y feature flags</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo experimento
        </Button>
      </div>

      {showCreate && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-base">Crear experimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium">Nombre</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="ej: discover_scoring_v2"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Descripción</label>
                <input
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Métrica objetivo</label>
                <select
                  value={newMetric}
                  onChange={e => setNewMetric(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm"
                >
                  <option value="activation_rate">Tasa de activación</option>
                  <option value="match_rate">Match rate</option>
                  <option value="d7_retention">Retención D7</option>
                  <option value="conversation_rate">Tasa de conversación</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Variantes</label>
                {newVariants.map((v, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <input
                      value={v.name}
                      onChange={e => {
                        const vs = [...newVariants];
                        vs[i].name = e.target.value;
                        setNewVariants(vs);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border bg-input text-sm"
                      placeholder="nombre"
                    />
                    <input
                      type="number"
                      value={v.trafficPct}
                      onChange={e => {
                        const vs = [...newVariants];
                        vs[i].trafficPct = Number(e.target.value);
                        setNewVariants(vs);
                      }}
                      className="w-20 px-3 py-2 rounded-lg border bg-input text-sm text-right"
                    />
                    <span className="text-xs text-muted-foreground self-center">%</span>
                    {newVariants.length > 2 && (
                      <button onClick={() => setNewVariants(newVariants.filter((_, j) => j !== i))} className="text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setNewVariants([...newVariants, { name: '', trafficPct: 0 }])}
                  className="text-xs text-purple-600 font-medium mt-1"
                >
                  + Añadir variante
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button size="sm" onClick={createExperiment} disabled={saving || !newName}>
                  {saving ? 'Guardando...' : 'Crear'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {experiments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No hay experimentos aún</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>Crear primer experimento</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiments.map(exp => {
            const best = exp.results?.variants?.reduce((a, b) => a.metricValue > b.metricValue ? a : b);
            return (
              <Card key={exp.id} className={`border-l-4 ${exp.status === 'running' ? 'border-l-green-500' : exp.status === 'completed' ? 'border-l-blue-500' : exp.status === 'draft' ? 'border-l-gray-300' : 'border-l-yellow-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{exp.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          exp.status === 'running' ? 'bg-green-100 text-green-700' :
                          exp.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          exp.status === 'draft' ? 'bg-muted-foreground/10 text-muted-foreground' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                      {exp.description && <p className="text-xs text-muted-foreground mb-2">{exp.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Métrica: <strong>{exp.metric}</strong></span>
                        <span>Usuarios: <strong>{exp._count.assignments}</strong></span>
                        <span>Creado: <strong>{new Date(exp.createdAt).toLocaleDateString()}</strong></span>
                      </div>
                      <div className="flex gap-3 mt-2">
                        {exp.variants.map(v => (
                          <span key={v.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {v.name}: {v.trafficPct}%
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {exp.status === 'draft' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(exp.id, 'running')} title="Iniciar">
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {exp.status === 'running' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(exp.id, 'paused')} title="Pausar">
                          <Pause className="h-4 w-4 text-yellow-600" />
                        </Button>
                      )}
                      {exp.status === 'paused' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(exp.id, 'running')} title="Reanudar">
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {(exp.status === 'running' || exp.status === 'paused') && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(exp.id, 'completed')} title="Finalizar">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteExperiment(exp.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {exp.results && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs font-medium mb-2">Resultados</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {exp.results.variants.map((v: VariantResult) => (
                          <div key={v.variantName} className={`p-2 rounded-lg ${v.variantName === exp.results?.winner ? 'bg-green-50 border border-green-200' : 'bg-muted/50'}`}>
                            <p className="text-xs font-bold uppercase">{v.variantName}</p>
                            <p className="text-lg font-bold">{v.metricValue}</p>
                            <p className="text-xs text-muted-foreground">{v.userCount} users</p>
                            {v.variantName === exp.results?.winner && (
                              <span className="text-[11px] text-green-600 font-bold">🏆 Ganador ({exp.results.confidence}%)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
