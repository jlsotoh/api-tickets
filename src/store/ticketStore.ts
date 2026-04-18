import { createStore } from 'zustand/vanilla';
import { Ticket, TicketActivity, TicketStatus, TicketStore, TicketCategory } from '../types';

/** Genera un UID aleatorio corto para búsqueda externa */
const generateUid = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export const ticketStore = createStore<TicketStore>((set, get) => ({
  tickets: [],
  activities: [],
  categories: [
    { id: 1, name: 'Soporte Técnico', is_active: true, created_at: new Date().toISOString() },
    { id: 2, name: 'Mantenimiento', is_active: true, created_at: new Date().toISOString() },
    { id: 3, name: 'Infraestructura', is_active: true, created_at: new Date().toISOString() },
    { id: 4, name: 'Software / Aplicaciones', is_active: true, created_at: new Date().toISOString() },
    { id: 5, name: 'Otros', is_active: true, created_at: new Date().toISOString() },
    { id: 6, name: 'Finanzas / Pagos', is_active: true, created_at: new Date().toISOString() },
  ],

  addTicket: (ticket: Ticket) => {
    set((state) => ({
      tickets: [...state.tickets, ticket],
    }));
  },

  getTickets: (status?: TicketStatus, uid?: string) => {
    const { tickets } = get();
    let filtered = tickets;
    if (status) filtered = filtered.filter((t) => t.status === status);
    if (uid) filtered = filtered.filter((t) => t.uid.includes(uid.toUpperCase()));
    return filtered;
  },

  getTicketById: (id: number) => {
    const { tickets } = get();
    return tickets.find((t) => t.id === id);
  },

  getTicketByUid: (uid: string) => {
    const { tickets } = get();
    return tickets.find((t) => t.uid === uid.toUpperCase());
  },

  updateTicketStatus: (id: number, status: TicketStatus, author: string, authorRole: TicketActivity['authorRole']) => {
    let updated: Ticket | undefined;
    const now = new Date().toISOString();
    
    set((state) => {
      const tickets = state.tickets.map((t) => {
        if (t.id === id) {
          updated = { ...t, status, updated_at: now };
          return updated;
        }
        return t;
      });

      // Crear actividad de cambio de estado
      const activity: TicketActivity = {
        id: state.activities.length + 1,
        idTicket: id,
        type: 'status_change',
        author,
        authorRole,
        content: `Cambio de estado a: ${status}`,
        statusBadge: status,
        created_at: now
      };

      return { tickets, activities: [...state.activities, activity] };
    });
    return updated;
  },

  addActivity: (activity: TicketActivity) => {
    set((state) => ({
      activities: [...state.activities, activity],
    }));
  },

  getActivitiesByTicketId: (ticketId: number) => {
    const { activities } = get();
    return activities.filter((a) => a.idTicket === ticketId);
  },
}));
