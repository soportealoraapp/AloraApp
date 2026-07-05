import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { status, description, metric, variants } = body;

    const existing = await prisma.experiment.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    if (body.name && body.name !== existing.name) {
      const nameConflict = await prisma.experiment.findUnique({ where: { name: body.name } });
      if (nameConflict) {
        return NextResponse.json({ error: 'Experiment name already exists' }, { status: 409 });
      }
    }

    await prisma.experiment.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(description !== undefined && { description }),
        ...(metric && { metric }),
        ...(status && ['draft', 'running', 'paused', 'completed'].includes(status) && { status }),
      },
    });

    if (variants && variants.length >= 2) {
      const totalTraffic = variants.reduce((s: number, v: { trafficPct: number }) => s + (v.trafficPct || 0), 0);
      if (Math.abs(totalTraffic - 100) > 1) {
        return NextResponse.json({ error: 'Variant traffic percentages must sum to 100' }, { status: 400 });
      }

      for (const v of variants) {
        if (v.id) {
          await prisma.experimentVariant.update({
            where: { id: v.id },
            data: { name: v.name, trafficPct: v.trafficPct },
          });
        } else {
          await prisma.experimentVariant.create({
            data: { experimentId: id, name: v.name, trafficPct: v.trafficPct },
          });
        }
      }
    }

    const updated = await prisma.experiment.findUnique({
      where: { id },
      include: { variants: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireSuperAdmin();
  if (auth) return auth;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await prisma.experimentAssignment.deleteMany({ where: { experimentId: id } });
    await prisma.experimentVariant.deleteMany({ where: { experimentId: id } });
    await prisma.experiment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
