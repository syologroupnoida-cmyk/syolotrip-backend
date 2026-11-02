import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../apps/server/src/index.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return (app as any)(req, res);
}

