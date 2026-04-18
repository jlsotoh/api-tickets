import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Middleware para validar la API Key en las cabeceras de la petición
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({
      error: 'API Key requerida',
      message: 'Debe proporcionar la cabecera x-api-key'
    });
    return;
  }

  if (apiKey !== env.API_KEY) {
    res.status(403).json({
      error: 'API Key inválida',
      message: 'La llave proporcionada no es válida'
    });
    return;
  }

  next();
};
