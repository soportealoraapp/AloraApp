import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    const body = await request.json();
    const { status, description, metric, variants } = body;

    const existing = await prisma.experiment.findUnique({
      where: { id: params.id },
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

    const experiment = await prisma.experiment.update({
      where: { id: params.id },
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
            data: { experimentId: params.id, name: v.name, trafficPct: v.trafficPct },
          });
        }
      }
    }

    const updated = await prisma.experiment.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  try {
    await prisma.experimentAssignment.deleteMany({ where: { experimentId: params.id } });
    await prisma.experimentVariant.deleteMany({ where: { experimentId: params.id } });
    await prisma.experiment.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
