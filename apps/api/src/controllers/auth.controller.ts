import type { NextFunction, Request, Response } from 'express';
import { ensureDefaultAdmin, loginUser, registerUser } from '../services/auth.service.js';

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(201).json(await registerUser(req.body));
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await loginUser(req.body));
  } catch (error) {
    next(error);
  }
}

export async function bootstrapAdminController(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureDefaultAdmin();
    next();
  } catch (error) {
    next(error);
  }
}
