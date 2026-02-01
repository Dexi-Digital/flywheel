import { NextRequest, NextResponse } from 'next/server';
import { buildService } from '@/services/factory';

export async function GET(request: NextRequest, context: { params: any }) {
  const params = await context.params;
  const agentId: string = params?.id;

  if (!agentId) {
    return NextResponse.json({ ok: false, error: 'agent id missing' }, { status: 400 });
  }

  try {
    const service = buildService(agentId);
    const agent = await service.getAgent(agentId);
    return NextResponse.json({ ok: true, agent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API agents] ${agentId} error:`, err);
    return NextResponse.json(
      { ok: false, error: message, agentId },
      { status: 500 }
    );
  }
}
