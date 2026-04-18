-- =============================================
-- Script: Generación de Base de Datos para Tickets Simoniz
-- Prefijo: tbl_S_qualitor_tickets_
-- =============================================

-- =============================================
-- 1. Limpieza de tablas existentes (en orden inverso de dependencia)
-- =============================================
IF OBJECT_ID('[dbo].[tbl_S_qualitor_tickets_activities]', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_S_qualitor_tickets_activities];
IF OBJECT_ID('[dbo].[tbl_S_qualitor_tickets_attachments]', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_S_qualitor_tickets_attachments];
IF OBJECT_ID('[dbo].[tbl_S_qualitor_tickets_records]', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_S_qualitor_tickets_records];
IF OBJECT_ID('[dbo].[tbl_S_qualitor_tickets_categories]', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_S_qualitor_tickets_categories];

-- =============================================
-- 2. Tabla: tbl_S_qualitor_tickets_categories
-- =============================================
CREATE TABLE [dbo].[tbl_S_qualitor_tickets_categories] (
    [id]          INT              IDENTITY(1,1) NOT NULL,
    [name]        NVARCHAR(150)    NOT NULL,
    [is_active]   BIT              NOT NULL DEFAULT 1,
    [created_at]  DATETIME         NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_tbl_S_qualitor_tickets_categories] PRIMARY KEY CLUSTERED ([id] ASC)
);

-- Poblar categorías iniciales
INSERT INTO [dbo].[tbl_S_qualitor_tickets_categories] ([name]) VALUES 
('Soporte Técnico'), ('Mantenimiento'), ('Infraestructura'), ('Software / Aplicaciones'), ('Otros'), ('Finanzas / Pagos');

-- =============================================
-- 3. Tabla: tbl_S_qualitor_tickets_records
-- =============================================
CREATE TABLE [dbo].[tbl_S_qualitor_tickets_records] (
    [id]              INT              IDENTITY(1,1) NOT NULL,
    [idUser]          INT              NOT NULL, 
    [idCategory]      INT              NOT NULL,
    [title]           NVARCHAR(100)    NOT NULL,
    [description]     NVARCHAR(1000)   NOT NULL,
    [priority]        NVARCHAR(50)     NOT NULL DEFAULT 'Medium', -- Low, Medium, High
    [status]          NVARCHAR(50)     NOT NULL DEFAULT 'Open',   -- Open, In Progress, Resolved, Closed
    [created_at]      DATETIME         NOT NULL DEFAULT GETDATE(),
    [updated_at]      DATETIME         NULL,
    CONSTRAINT [PK_tbl_S_qualitor_tickets_records] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_tbl_S_qualitor_tickets_records_Category] FOREIGN KEY ([idCategory]) 
        REFERENCES [dbo].[tbl_S_qualitor_tickets_categories] ([id])
);

-- =============================================
-- 4. Tabla: tbl_S_qualitor_tickets_attachments
-- =============================================
CREATE TABLE [dbo].[tbl_S_qualitor_tickets_attachments] (
    [id]              INT              IDENTITY(1,1) NOT NULL,
    [idTicket]        INT              NOT NULL,
    [name]            NVARCHAR(255)    NOT NULL,
    [type]            NVARCHAR(50)     NOT NULL, -- image, pdf, other
    [url]             NVARCHAR(500)    NOT NULL,
    [size]            NVARCHAR(50)     NULL,
    [created_at]      DATETIME         NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_tbl_S_qualitor_tickets_attachments] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_tbl_S_qualitor_tickets_attachments_Ticket] FOREIGN KEY ([idTicket]) 
        REFERENCES [dbo].[tbl_S_qualitor_tickets_records] ([id]) ON DELETE CASCADE
);

-- =============================================
-- 5. Tabla: tbl_S_qualitor_tickets_activities
-- =============================================
CREATE TABLE [dbo].[tbl_S_qualitor_tickets_activities] (
    [id]              INT              IDENTITY(1,1) NOT NULL,
    [idTicket]        INT              NOT NULL,
    [type]            NVARCHAR(50)     NOT NULL, -- message, status_change, creation
    [author]          NVARCHAR(150)    NOT NULL,
    [authorRole]      NVARCHAR(50)     NOT NULL, -- User, Admin, System
    [content]         NVARCHAR(MAX)    NOT NULL,
    [statusBadge]     NVARCHAR(50)     NULL,
    [created_at]      DATETIME         NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_tbl_S_qualitor_tickets_activities] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [FK_tbl_S_qualitor_tickets_activities_Ticket] FOREIGN KEY ([idTicket]) 
        REFERENCES [dbo].[tbl_S_qualitor_tickets_records] ([id]) ON DELETE CASCADE
);

-- =============================================
-- 6. Índices para rendimiento
-- =============================================
CREATE NONCLUSTERED INDEX [IX_tbl_S_qualitor_tickets_records_idUser] ON [dbo].[tbl_S_qualitor_tickets_records] ([idUser]);
CREATE NONCLUSTERED INDEX [IX_tbl_S_qualitor_tickets_records_status] ON [dbo].[tbl_S_qualitor_tickets_records] ([status]);
CREATE NONCLUSTERED INDEX [IX_tbl_S_qualitor_tickets_attachments_idTicket] ON [dbo].[tbl_S_qualitor_tickets_attachments] ([idTicket]);
CREATE NONCLUSTERED INDEX [IX_tbl_S_qualitor_tickets_activities_idTicket] ON [dbo].[tbl_S_qualitor_tickets_activities] ([idTicket]);
