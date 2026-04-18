export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface TicketCategory {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: number;
  uid: string; // Used for public searching/filtering
  idUser: number;
  idCategory: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at?: string;
}

export interface TicketAttachment {
  id: number;
  idTicket: number;
  name: string;
  type: string;
  url: string;
  size?: string;
  created_at: string;
}

export interface TicketActivity {
  id: number;
  idTicket: number;
  type: 'message' | 'status_change' | 'creation';
  author: string;
  authorRole: 'User' | 'Admin' | 'System';
  content: string;
  statusBadge?: string;
  created_at: string;
}

export interface TicketStore {
  tickets: Ticket[];
  activities: TicketActivity[];
  categories: TicketCategory[];
  addTicket: (ticket: Ticket) => void;
  getTickets: (status?: TicketStatus, uid?: string) => Ticket[];
  getTicketById: (id: number) => Ticket | undefined;
  getTicketByUid: (uid: string) => Ticket | undefined;
  updateTicketStatus: (id: number, status: TicketStatus, author: string, authorRole: TicketActivity['authorRole']) => Ticket | undefined;
  addActivity: (activity: TicketActivity) => void;
  getActivitiesByTicketId: (ticketId: number) => TicketActivity[];
}
