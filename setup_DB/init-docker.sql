SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF DB_ID(N'GESTIONALE_AUTO') IS NULL
    CREATE DATABASE [GESTIONALE_AUTO];
GO

USE [GESTIONALE_AUTO];
GO

IF OBJECT_ID(N'dbo.Veicoli', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Veicoli](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Brand] [nvarchar](50) NOT NULL,
        [Modello] [nvarchar](100) NOT NULL,
        [Immatricolazione] [datetime2](7) NULL,
        [ProprietaLeasing] [nvarchar](50) NULL,
        [Contratto] [nvarchar](max) NULL,
        [TelepassSINO] [bit] NULL,
        [TelepassNumero] [nvarchar](50) NULL,
        [SecondaChiave] [nvarchar](50) NULL,
        [Assegnazione] [nvarchar](50) NULL,
        [Targa] [nvarchar](10) NULL,
        [Note] [nvarchar](max) NULL,
        [CreatedAt] [datetime2](7) NULL,
        [UpdatedAt] [datetime2](7) NULL,
        [Azienda] [nvarchar](50) NULL,
        [EmailAssegnatario] [varchar](50) NULL,
        PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_Veicoli_Targa] UNIQUE NONCLUSTERED ([Targa] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.Assicurazioni', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Assicurazioni](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Id_veicolo] [int] NOT NULL,
        [Compagnia] [nvarchar](50) NULL,
        [nome] [nvarchar](50) NULL,
        [Numero_polizza] [nvarchar](50) NULL,
        [Data_ultimo_pagamento] [datetime] NULL,
        [Data_scadenza] [datetime] NULL,
        [Periodo_di_tolleranza] [int] NULL,
        [Importo] [decimal](10, 2) NULL,
        [note] [nvarchar](max) NULL,
        [ClasseDiMerito] [nvarchar](50) NULL,
        CONSTRAINT [PK_Assicurazioni] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.Bolli', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Bolli](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Id_veicolo] [int] NOT NULL,
        [inizio_validita] [datetime] NULL,
        [fine_validita] [datetime] NULL,
        [scadenza] [datetime] NULL,
        [nome] [varchar](50) NULL,
        [importo] [decimal](10, 2) NULL,
        [note] [nvarchar](max) NULL,
        CONSTRAINT [PK_Bolli] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.Revisioni', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Revisioni](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [nome] [varchar](50) NULL,
        [Id_Veicolo] [int] NOT NULL,
        [Data_revisione] [date] NULL,
        [Data_scadenza] [date] NULL,
        [Esito] [varchar](20) NULL,
        [Km] [int] NULL,
        [Importo] [decimal](10, 2) NULL,
        [Centro_revisione] [varchar](150) NULL,
        [Note] [varchar](500) NULL,
        PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.Tagliando', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Tagliando](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Id_veicolo] [int] NOT NULL,
        [nome] [nvarchar](50) NULL,
        [data_scadenza] [datetime] NULL,
        [scadenza_km] [nvarchar](50) NULL,
        [note] [nvarchar](max) NULL,
        [importo] [decimal](10, 2) NULL,
        [Data_tagliando] [datetime] NULL,
        CONSTRAINT [PK_Tagliando] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.Config', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Config](
        [Chiave] [nvarchar](50) NOT NULL,
        [Valore] [bit] NULL,
        CONSTRAINT [PK_Config] PRIMARY KEY CLUSTERED ([Chiave] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.ImpostazioniEmail', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ImpostazioniEmail](
        [Destinatario] [nvarchar](20) NOT NULL,
        [TipoAvviso] [nvarchar](20) NOT NULL,
        [Giorni] [int] NOT NULL,
        [UpdatedAt] [datetime] NOT NULL,
        CONSTRAINT [PK_ImpostazioniEmail] PRIMARY KEY CLUSTERED ([Destinatario] ASC, [TipoAvviso] ASC)
    );
END
GO

IF OBJECT_ID(N'dbo.TestRealtime', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[TestRealtime](
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [Messaggio] [nvarchar](255) NULL,
        [DataModifica] [datetime2](7) NULL,
        PRIMARY KEY CLUSTERED ([ID] ASC)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Assicurazioni_Auto')
    ALTER TABLE [dbo].[Assicurazioni] WITH CHECK ADD CONSTRAINT [FK_Assicurazioni_Auto]
        FOREIGN KEY([Id_veicolo]) REFERENCES [dbo].[Veicoli] ([Id]) ON DELETE CASCADE;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Assicurazioni_Auto')
    ALTER TABLE [dbo].[Assicurazioni] CHECK CONSTRAINT [FK_Assicurazioni_Auto];
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Bolli_Auto')
    ALTER TABLE [dbo].[Bolli] WITH CHECK ADD CONSTRAINT [FK_Bolli_Auto]
        FOREIGN KEY([Id_veicolo]) REFERENCES [dbo].[Veicoli] ([Id]) ON DELETE CASCADE;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Bolli_Auto')
    ALTER TABLE [dbo].[Bolli] CHECK CONSTRAINT [FK_Bolli_Auto];
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Revisioni_Auto')
    ALTER TABLE [dbo].[Revisioni] WITH CHECK ADD CONSTRAINT [FK_Revisioni_Auto]
        FOREIGN KEY([Id_Veicolo]) REFERENCES [dbo].[Veicoli] ([Id]) ON DELETE CASCADE;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Revisioni_Auto')
    ALTER TABLE [dbo].[Revisioni] CHECK CONSTRAINT [FK_Revisioni_Auto];
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Tagliandi_Auto')
    ALTER TABLE [dbo].[Tagliando] WITH CHECK ADD CONSTRAINT [FK_Tagliandi_Auto]
        FOREIGN KEY([Id_veicolo]) REFERENCES [dbo].[Veicoli] ([Id]) ON DELETE CASCADE;
GO
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Tagliandi_Auto')
    ALTER TABLE [dbo].[Tagliando] CHECK CONSTRAINT [FK_Tagliandi_Auto];
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Destinatario'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] WITH CHECK ADD CONSTRAINT [CK_ImpostazioniEmail_Destinatario]
        CHECK (([Destinatario]=N'owner' OR [Destinatario]=N'admin'));
GO
IF EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Destinatario'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] CHECK CONSTRAINT [CK_ImpostazioniEmail_Destinatario];
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Giorni'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] WITH CHECK ADD CONSTRAINT [CK_ImpostazioniEmail_Giorni]
        CHECK (([Giorni]>=(0) AND [Giorni]<=(90)));
GO
IF EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Giorni'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] CHECK CONSTRAINT [CK_ImpostazioniEmail_Giorni];
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Tipo'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] WITH CHECK ADD CONSTRAINT [CK_ImpostazioniEmail_Tipo]
        CHECK (([TipoAvviso]=N'tagliando' OR [TipoAvviso]=N'revisione' OR [TipoAvviso]=N'bollo' OR [TipoAvviso]=N'assicurazione'));
GO
IF EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ImpostazioniEmail_Tipo'
)
    ALTER TABLE [dbo].[ImpostazioniEmail] CHECK CONSTRAINT [CK_ImpostazioniEmail_Tipo];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Config WHERE Chiave = N'email-key')
    INSERT INTO dbo.Config (Chiave, Valore) VALUES (N'email-key', 0);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ImpostazioniEmail)
BEGIN
    DECLARE @now datetime = GETDATE();
    INSERT INTO dbo.ImpostazioniEmail (Destinatario, TipoAvviso, Giorni, UpdatedAt) VALUES
        (N'admin', N'assicurazione', 30, @now),
        (N'admin', N'bollo', 30, @now),
        (N'admin', N'revisione', 30, @now),
        (N'admin', N'tagliando', 30, @now),
        (N'owner', N'assicurazione', 30, @now),
        (N'owner', N'bollo', 30, @now),
        (N'owner', N'revisione', 30, @now),
        (N'owner', N'tagliando', 30, @now);
END
GO
