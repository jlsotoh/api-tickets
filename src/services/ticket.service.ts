import mssql from 'mssql';
import * as ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { poolPromise } from '../config/database';
import { Ticket, TicketCategory, TicketActivity, TicketStatus } from '../types';

export const ticketService = {
  getAllCategories: async (): Promise<TicketCategory[]> => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM tbl_S_qualitor_tickets_categories WHERE is_active = 1');
    return result.recordset;
  },

  getTickets: async (status?: string, uid?: string): Promise<Ticket[]> => {
    const pool = await poolPromise;
    let query = 'SELECT * FROM tbl_S_qualitor_tickets_records WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', mssql.NVarChar, status);
    }
    if (uid) {
      query += ' AND uid LIKE @uid';
      request.input('uid', mssql.NVarChar, `%${uid}%`);
    }

    query += ' ORDER BY created_at DESC';
    const result = await request.query(query);
    return result.recordset;
  },

  getTicketById: async (id: number): Promise<Ticket | null> => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', mssql.Int, id)
      .query('SELECT * FROM tbl_S_qualitor_tickets_records WHERE id = @id');
    return result.recordset[0] || null;
  },

  getTicketByUid: async (uid: string): Promise<Ticket | null> => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('uid', mssql.NVarChar, uid)
      .query('SELECT * FROM tbl_S_qualitor_tickets_records WHERE uid = @uid');
    return result.recordset[0] || null;
  },

  createTicket: async (data: any, evidenceData?: { name: string, type: string, url: string, size?: string }): Promise<Ticket & { evidenceUrl?: string }> => {
    const pool = await poolPromise;
    const transaction = new mssql.Transaction(pool);

    try {
      await transaction.begin();

      const result = await transaction.request()
        .input('idUser', mssql.Int, data.idUser)
        .input('idCategory', mssql.Int, data.idCategory)
        .input('title', mssql.NVarChar, data.title)
        .input('description', mssql.NVarChar, data.description)
        .input('priority', mssql.NVarChar, data.priority || 'Medium')
        .query(`
          INSERT INTO tbl_S_qualitor_tickets_records (idUser, idCategory, title, description, priority, status)
          OUTPUT INSERTED.*
          VALUES (@idUser, @idCategory, @title, @description, @priority, 'Open')
        `);

      const ticket = result.recordset[0];
      let evidenceUrl = undefined;

      if (ticket && evidenceData) {
        const client = new ftp.Client();
        client.ftp.verbose = false;

        try {
          // Conectar al FTP
          await client.access({
            host: env.HOST_FTP,
            user: env.USER_FTP,
            password: env.PASS_FTP,
            port: 21,
            secure: false
          });

          // Crear carpeta por ticket id
          const remoteDir = `codigos/${ticket.id}`;
          await client.ensureDir(remoteDir);

          // Subir archivo
          const localFilePath = path.join(process.cwd(), 'uploads', evidenceData.name);
          await client.uploadFrom(localFilePath, evidenceData.name);

          // Construir URL final: URL_TICKETS/idTicket/nombrearchivo
          let baseUrl = env.URL_TICKETS;
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
          }
          evidenceUrl = `${baseUrl}/${ticket.id}/${evidenceData.name}`;

          // Guardar en la base de datos con la URL de FTP
          await transaction.request()
            .input('idTicket', mssql.Int, ticket.id)
            .input('name', mssql.NVarChar, evidenceData.name)
            .input('type', mssql.NVarChar, evidenceData.type)
            .input('url', mssql.NVarChar, evidenceUrl)
            .input('size', mssql.NVarChar, evidenceData.size || null)
            .query(`
              INSERT INTO tbl_S_qualitor_tickets_attachments (idTicket, name, type, url, size)
              VALUES (@idTicket, @name, @type, @url, @size)
            `);

          // Eliminar archivo local después de subirlo
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        } catch (ftpError) {
          console.error('Error in FTP upload:', ftpError);
          throw new Error('No se pudo subir el archivo al servidor FTP. El ticket no fue creado.');
        } finally {
          client.close();
        }
      }

      await transaction.commit();
      return { ...ticket, evidenceUrl };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  updateStatus: async (id: number, status: string, author: string, authorRole: string): Promise<Ticket | null> => {
    const pool = await poolPromise;
    const transaction = new mssql.Transaction(pool);
    try {
      await transaction.begin();

      const updateResult = await transaction.request()
        .input('id', mssql.Int, id)
        .input('status', mssql.NVarChar, status)
        .query('UPDATE tbl_S_qualitor_tickets_records SET status = @status, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @id');

      const ticket = updateResult.recordset[0];
      if (ticket) {
        await transaction.request()
          .input('idTicket', mssql.Int, id)
          .input('type', mssql.NVarChar, 'status_change')
          .input('author', mssql.NVarChar, author)
          .input('authorRole', mssql.NVarChar, authorRole)
          .input('content', mssql.NVarChar, `Estado cambiado a ${status}`)
          .input('statusBadge', mssql.NVarChar, status)
          .query('INSERT INTO tbl_S_qualitor_tickets_activities (idTicket, type, author, authorRole, content, statusBadge) VALUES (@idTicket, @type, @author, @authorRole, @content, @statusBadge)');
      }

      await transaction.commit();
      return ticket;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  addActivity: async (data: any): Promise<TicketActivity> => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('idTicket', mssql.Int, data.idTicket)
      .input('type', mssql.NVarChar, data.type || 'message')
      .input('author', mssql.NVarChar, data.author)
      .input('authorRole', mssql.NVarChar, data.authorRole)
      .input('content', mssql.NVarChar, data.content)
      .input('statusBadge', mssql.NVarChar, data.statusBadge)
      .query(`
        INSERT INTO tbl_S_qualitor_tickets_activities (idTicket, type, author, authorRole, content, statusBadge)
        OUTPUT INSERTED.*
        VALUES (@idTicket, @type, @author, @authorRole, @content, @statusBadge)
      `);
    return result.recordset[0];
  },

  getActivitiesByTicketId: async (ticketId: number): Promise<TicketActivity[]> => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ticketId', mssql.Int, ticketId)
      .query('SELECT * FROM tbl_S_qualitor_tickets_activities WHERE idTicket = @ticketId ORDER BY created_at DESC');
    return result.recordset;
  }
};
