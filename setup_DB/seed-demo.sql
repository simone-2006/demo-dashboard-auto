USE [GESTIONALE_AUTO];
SET NOCOUNT ON;

DELETE FROM dbo.Assicurazioni;
DELETE FROM dbo.Bolli;
DELETE FROM dbo.Revisioni;
DELETE FROM dbo.Tagliando;
DELETE FROM dbo.TestRealtime;
DELETE FROM dbo.Veicoli;
DELETE FROM dbo.ImpostazioniEmail;

IF COL_LENGTH('dbo.Veicoli', 'Id') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE [object_id] = OBJECT_ID(N'dbo.Veicoli') AND last_value IS NOT NULL)
        DBCC CHECKIDENT (N'dbo.Veicoli', RESEED, 0);
    IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE [object_id] = OBJECT_ID(N'dbo.Assicurazioni') AND last_value IS NOT NULL)
        DBCC CHECKIDENT (N'dbo.Assicurazioni', RESEED, 0);
    IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE [object_id] = OBJECT_ID(N'dbo.Bolli') AND last_value IS NOT NULL)
        DBCC CHECKIDENT (N'dbo.Bolli', RESEED, 0);
    IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE [object_id] = OBJECT_ID(N'dbo.Revisioni') AND last_value IS NOT NULL)
        DBCC CHECKIDENT (N'dbo.Revisioni', RESEED, 0);
    IF EXISTS (SELECT 1 FROM sys.identity_columns WHERE [object_id] = OBJECT_ID(N'dbo.Tagliando') AND last_value IS NOT NULL)
        DBCC CHECKIDENT (N'dbo.Tagliando', RESEED, 0);
END

DECLARE @oggi date = CAST(GETDATE() AS date);

-- MACCHINE PIÙ NORMALI!
INSERT INTO dbo.Veicoli (
    Brand, Modello, Immatricolazione, ProprietaLeasing, Contratto,
    TelepassSINO, TelepassNumero, SecondaChiave, Assegnazione, Targa,
    Note, CreatedAt, UpdatedAt, Azienda, EmailAssegnatario
) VALUES
    (N'Fiat', N'Panda', DATEADD(year, -8, @oggi), N'proprietà', NULL,
     1, N'1234567890', N'Sì', N'Luca Neri', N'AB123CD',
     N'Colore bianco. Utilitaria da città.', DATEADD(year, -8, @oggi), @oggi, N'Company 1', N'luca.neri@demo.it'),
    (N'Volkswagen', N'Golf', DATEADD(year, -3, @oggi), N'leasing', N'L-2021-0100',
     1, N'0987654321', N'No', N'Marco Bianchi', N'EF456GH',
     N'Colore blu. Leasing, 5 porte.', DATEADD(year, -3, @oggi), @oggi, N'Company 1', N'marco.bianchi@demo.it'),
    (N'Ford', N'Focus', DATEADD(year, -5, @oggi), N'proprietà', NULL,
     0, NULL, N'Sì', N'Anna Rossi', N'IJ789KL',
     N'Servizi regolari. Station wagon.', DATEADD(year, -5, @oggi), @oggi, N'Company 2', N'anna.rossi@demo.it'),
    (N'Toyota', N'Yaris', DATEADD(year, -2, @oggi), N'proprietà', NULL,
     0, NULL, N'Ufficio', N'Paolo Galli', N'MN234OP',
     N'Ibrida. Perfetta per spostamenti urbani.', DATEADD(year, -2, @oggi), @oggi, N'Company 1', N'paolo.galli@demo.it'),
    (N'Renault', N'Clio', DATEADD(year, -4, @oggi), N'leasing', N'L-2020-0950',
     1, N'1357913579', N'No', N'Sara Verdi', N'QR567ST',
     N'Colore rosso. Leasing aziendale.', DATEADD(year, -4, @oggi), @oggi, N'Company 2', N'sara.verdi@demo.it'),
    (N'Opel', N'Corsa', DATEADD(year, -7, @oggi), N'proprietà', NULL,
     0, NULL, N'Sì', N'Mario Conti', N'UV890WX',
     N'Manuale, benzina, in uso al magazzino.', DATEADD(year, -7, @oggi), @oggi, N'Company 2', N'mario.conti@demo.it');

DECLARE @panda int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'AB123CD');
DECLARE @golf int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'EF456GH');
DECLARE @focus int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'IJ789KL');
DECLARE @yaris int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'MN234OP');
DECLARE @clio int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'QR567ST');
DECLARE @corsa int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'UV890WX');

INSERT INTO dbo.Assicurazioni (
    Id_veicolo, Compagnia, nome, Numero_polizza, Data_ultimo_pagamento,
    Data_scadenza, Periodo_di_tolleranza, Importo, note, ClasseDiMerito
) VALUES
    (@panda, N'UnipolSai', N'RCA Panda', N'UNI-90001', DATEADD(year, -1, @oggi), DATEADD(month, -2, @oggi), 15, 520.00, NULL, N'1'),
    (@golf, N'Allianz', N'RCA Golf', N'ALL-52021', DATEADD(month, -13, @oggi), DATEADD(month, -1, @oggi), 15, 740.00, N'Responsabilità civile base.', N'1'),
    (@focus, N'Genertel', N'RCA Focus', N'GEN-30012', DATEADD(month, -9, @oggi), DATEADD(month, 3, @oggi), 15, 630.00, NULL, N'1'),
    (@yaris, N'Linear', N'RCA Yaris', N'LIN-80045', DATEADD(month, -6, @oggi), DATEADD(year, 1, @oggi), 15, 580.00, NULL, N'1'),
    (@clio, N'AXA', N'RCA Clio', N'AXA-56784', DATEADD(month, -8, @oggi), DATEADD(month, 2, @oggi), 15, 670.00, N'Estensione furto/incendio.', N'1'),
    (@corsa, N'Genialloyd', N'RCA Corsa', N'GEN-11223', DATEADD(month, -11, @oggi), DATEADD(month, 1, @oggi), 15, 610.00, NULL, N'1');

INSERT INTO dbo.Bolli (
    Id_veicolo, inizio_validita, fine_validita, scadenza, nome, importo, note
) VALUES
    (@panda, DATEADD(year, -1, @oggi), DATEADD(month, 5, @oggi), DATEADD(month, 5, @oggi), N'Bollo 2024', 130.00, NULL),
    (@golf, DATEADD(month, -14, @oggi), DATEADD(month, -2, @oggi), DATEADD(month, -2, @oggi), N'Bollo 2023', 200.00, NULL),
    (@golf, DATEADD(month, -2, @oggi), DATEADD(month, 10, @oggi), DATEADD(month, 10, @oggi), N'Bollo 2024', 210.00, N'Versato, scadenza nel 2025.'),
    (@focus, DATEADD(year, -1, @oggi), DATEADD(month, 2, @oggi), DATEADD(month, 2, @oggi), N'Bollo 2024', 180.00, NULL),
    (@yaris, DATEADD(month, -8, @oggi), DATEADD(year, 1, @oggi), DATEADD(year, 1, @oggi), N'Bollo 2025', 145.00, NULL),
    (@clio, DATEADD(month, -14, @oggi), DATEADD(month, -3, @oggi), DATEADD(month, -3, @oggi), N'Bollo 2023', 160.00, NULL),
    (@clio, DATEADD(month, -3, @oggi), DATEADD(month, 9, @oggi), DATEADD(month, 9, @oggi), N'Bollo 2024', 165.00, NULL),
    (@corsa, DATEADD(year, -1, @oggi), DATEADD(month, 1, @oggi), DATEADD(month, 1, @oggi), N'Bollo 2024', 170.00, NULL);

INSERT INTO dbo.Revisioni (
    nome, Id_Veicolo, Data_revisione, Data_scadenza, Esito, Km, Importo, Centro_revisione, Note
) VALUES
    (N'Revisione 2022', @panda, DATEADD(year, -2, @oggi), DATEADD(year, 2, @oggi), N'Regolare', 58000, 67.00, N'Autofficina Neri', NULL),
    (N'Revisione 2023', @golf, DATEADD(year, -1, @oggi), DATEADD(year, 1, @oggi), N'Regolare', 42000, 67.00, N'Volkswagen Service', NULL),
    (N'Revisione 2021', @focus, DATEADD(year, -3, @oggi), DATEADD(month, 7, @oggi), N'Regolare', 64500, 67.00, N'Ford Service', NULL),
    (N'Revisione 2023', @yaris, DATEADD(month, -10, @oggi), DATEADD(month, 26, @oggi), N'Regolare', 18500, 67.00, N'Toyota Center', NULL),
    (N'Revisione 2022', @clio, DATEADD(year, -2, @oggi), DATEADD(year, 2, @oggi), N'Regolare', 39000, 67.00, N'Renault Center', NULL),
    (N'Revisione 2021', @corsa, DATEADD(year, -3, @oggi), DATEADD(month, 9, @oggi), N'Regolare', 56000, 67.00, N'Opel Service', NULL);

INSERT INTO dbo.Tagliando (
    Id_veicolo, nome, data_scadenza, scadenza_km, note, importo, Data_tagliando
) VALUES
    (@panda, N'Tagliando annuale', DATEADD(year, -1, @oggi), N'60000', N'Sostituiti filtro aria e olio.', 210.00, DATEADD(year, -1, @oggi)),
    (@golf, N'Tagliando cambio olio', DATEADD(month, -6, @oggi), N'47000', NULL, 170.00, DATEADD(month, -6, @oggi)),
    (@focus, N'Tagliando completo', DATEADD(month, -5, @oggi), N'65000', N'Sostituzione pastiglie freni.', 250.00, DATEADD(month, -5, @oggi)),
    (@yaris, N'Tagliando ordinario', DATEADD(month, -12, @oggi), N'20000', NULL, 160.00, DATEADD(month, -12, @oggi)),
    (@clio, N'Tagliando annuale', DATEADD(month, -10, @oggi), N'42000', NULL, 180.00, DATEADD(month, -10, @oggi)),
    (@corsa, N'Tagliando freni', DATEADD(month, -4, @oggi), N'58000', N'Sostituzione dischi e pastiglie.', 270.00, DATEADD(month, -4, @oggi));

UPDATE dbo.Config SET Valore = 0 WHERE Chiave = N'email-key';
IF NOT EXISTS (SELECT 1 FROM dbo.Config WHERE Chiave = N'email-key')
    INSERT INTO dbo.Config (Chiave, Valore) VALUES (N'email-key', 0);

INSERT INTO dbo.ImpostazioniEmail (Destinatario, TipoAvviso, Giorni, UpdatedAt) VALUES
    (N'admin', N'assicurazione', 30, GETDATE()),
    (N'admin', N'bollo', 30, GETDATE()),
    (N'admin', N'revisione', 30, GETDATE()),
    (N'admin', N'tagliando', 30, GETDATE()),
    (N'owner', N'assicurazione', 15, GETDATE()),
    (N'owner', N'bollo', 15, GETDATE()),
    (N'owner', N'revisione', 15, GETDATE()),
    (N'owner', N'tagliando', 15, GETDATE());
