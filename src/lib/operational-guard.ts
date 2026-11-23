import { timingSafeEqual } from 'node:crypto';

/** Fail closed before operations that can send, charge, or modify customer data. */
export function authorizeCron(request: Request, configuredSecret: string | undefined): Response | null {
  const secret = configuredSecret?.trim();
  if (!secret) return Response.json({ error: 'Operation is not configured' }, { status: 503 });
  const supplied = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** This switch is a technical control, not authorization to incur an expense. */
export function authorizeExternalDiagnostics(request: Request, enabled: string | undefined, secret: string | undefined): Response | null {
  if (enabled !== 'true') {
    return Response.json({ error: 'External diagnostics are disabled to avoid unintended charges.' }, { status: 503 });
  }
  return authorizeCron(request, secret);
}
