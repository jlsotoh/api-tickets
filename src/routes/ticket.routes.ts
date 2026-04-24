import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ticketService } from '../services/ticket.service';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  createActivitySchema,
  queryTicketsSchema,
} from '../schemas/ticket.schema';




const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});



/** Helper para extraer param como string o number */
const paramAsString = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

/**
 * GET /api/tickets/categories
 * Listar categorías disponibles
 */
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await ticketService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

/**
 * POST /api/tickets
 * Crear un nuevo ticket
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = createTicketSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Datos inválidos', details: result.error.format() });
    return;
  }

  try {
    const ticket = await ticketService.createTicket(result.data);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Error al crear el ticket', message: error.message });
  }
});

/**
 * POST /api/tickets/:id/attachments
 * Registrar evidencia para un ticket existente
 */
router.post('/:id/attachments', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(paramAsString(req.params.id), 10);
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'El archivo de imagen es requerido' });
    return;
  }

  try {
    const attachment = await ticketService.addAttachment(id, file);
    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Error registering attachment:', error);
    res.status(500).json({ error: 'Error al registrar la evidencia', message: error.message });
  }
});

/**
 * GET /api/tickets
 * Listar tickets, filtrar por status o uid
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = queryTicketsSchema.safeParse(req.query);

  if (!query.success) {
    res.status(400).json({ error: 'Query inválido', details: query.error.format() });
    return;
  }

  try {
    const tickets = await ticketService.getTickets(query.data.status, query.data.uid);
    res.json({ total: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar tickets' });
  }
});

/**
 * GET /api/tickets/:id
 * Obtener detalle de un ticket
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const idStr = paramAsString(req.params.id);

  try {
    let ticket;
    if (isNaN(Number(idStr))) {
      ticket = await ticketService.getTicketByUid(idStr);
    } else {
      ticket = await ticketService.getTicketById(Number(idStr));
    }

    if (!ticket) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    const activities = await ticketService.getActivitiesByTicketId(ticket.id);
    res.json({ ...ticket, activities });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalle del ticket' });
  }
});

/**
 * PATCH /api/tickets/:id
 * Actualizar el estatus de un ticket
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(paramAsString(req.params.id), 10);
  const result = updateTicketStatusSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Datos inválidos', details: result.error.format() });
    return;
  }

  try {
    const updated = await ticketService.updateStatus(
      id,
      result.data.status,
      result.data.author,
      result.data.authorRole
    );

    if (!updated) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estatus' });
  }
});

/**
 * POST /api/tickets/:id/comments
 */
router.post('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(paramAsString(req.params.id), 10);
  const result = createActivitySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Datos inválidos', details: result.error.format() });
    return;
  }

  try {
    const activity = await ticketService.addActivity({
      ...result.data,
      idTicket: id
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir comentario' });
  }
});

export default router; 
