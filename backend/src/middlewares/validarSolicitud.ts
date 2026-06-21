import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log("[ZOD ERROR]:", JSON.stringify(error.format(), null, 2));
        return res.status(400).json({
          status: 'error',
          message: 'Error de validación',
          errors: error.issues,
        });
      }
      next(error);
    }
  };
};
