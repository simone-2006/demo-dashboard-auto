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

INSERT INTO dbo.Veicoli (
    Brand, Modello, Immatricolazione, ProprietaLeasing, Contratto,
    TelepassSINO, TelepassNumero, SecondaChiave, Assegnazione, Targa,
    Note, CreatedAt, UpdatedAt, Azienda, EmailAssegnatario
) VALUES
    (N'Ferrari', N'296 GTB', DATEADD(year, -4, @oggi), N'proprietà', NULL,
     0, NULL, N'No', N'Mario Rossi', N'GT456AB',
     N'Rosso Corsa, Assetto Fiorano. Solo eventi e clienti.', DATEADD(year, -4, @oggi), @oggi, N'Company 1', N'mario.rossi@demo.it'),
    (N'Lamborghini', N'Revuelto', DATEADD(year, -2, @oggi), N'leasing', N'L-2024-0188',
     1, N'2059384716', N'Sì', N'Luca Bianchi', N'FA789CD',
     N'Verde Scandal, V12 ibrido. Leasing 36 mesi.', DATEADD(year, -2, @oggi), @oggi, N'Company 1', N'luca.bianchi@demo.it'),
    (N'Porsche', N'911 GT3 RS', DATEADD(year, -5, @oggi), N'proprietà', NULL,
     1, N'1182046632', N'Sì', N'Anna Verdi', N'GE234EF',
     N'Weissach Package, track day una volta al mese.', DATEADD(year, -5, @oggi), @oggi, N'Company 2', N'anna.verdi@demo.it'),
    (N'Aston Martin', N'DB12', DATEADD(year, -6, @oggi), N'proprietà', NULL,
     0, NULL, N'Ufficio', N'Paolo Neri', N'HB567GH',
     N'British Racing Green. Seconda chiave in cassaforte.', DATEADD(year, -6, @oggi), @oggi, N'Company 1', N'paolo.neri@demo.it'),
    (N'Ferrari', N'SF90 Stradale', DATEADD(year, -3, @oggi), N'leasing', N'L-2023-0091',
     0, NULL, N'No', N'Sara Galli', N'JC890IL',
     N'Giallo Modena, Assetto Fiorano. Restituzione leasing tra 12 mesi.', DATEADD(year, -3, @oggi), @oggi, N'Company 2', N'sara.galli@demo.it'),
    (N'Lamborghini', N'Huracán STO', DATEADD(year, -7, @oggi), N'proprietà', NULL,
     1, N'4471209853', N'Sì', N'Marco Conti', N'KD123MN',
     N'Blu Laufey. Direzione commerciale, uso limitato.', DATEADD(year, -7, @oggi), @oggi, N'Company 2', N'marco.conti@demo.it');

DECLARE @ferrari int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'GT456AB');
DECLARE @lambo int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'FA789CD');
DECLARE @porsche int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'GE234EF');
DECLARE @aston int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'HB567GH');
DECLARE @sf90 int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'JC890IL');
DECLARE @huracan int = (SELECT Id FROM dbo.Veicoli WHERE Targa = N'KD123MN');

INSERT INTO dbo.Assicurazioni (
    Id_veicolo, Compagnia, nome, Numero_polizza, Data_ultimo_pagamento,
    Data_scadenza, Periodo_di_tolleranza, Importo, note, ClasseDiMerito
) VALUES
    (@ferrari, N'UnipolSai', N'RCA 2024', N'UNI-44120', DATEADD(day, -377, @oggi), DATEADD(day, -12, @oggi), 15, 4200.00, N'Rinnovata.', N'1'),
    (@ferrari, N'UnipolSai', N'RCA 2025', N'UNI-50881', DATEADD(day, -12, @oggi), DATEADD(day, 12, @oggi), 15, 4480.00, N'Scade a breve. Kasko full.', N'1'),
    (@lambo, N'Generali', N'RCA Revuelto', N'GEN-22019', DATEADD(day, -385, @oggi), DATEADD(day, -20, @oggi), 15, 6800.00, N'Scaduta oltre tolleranza.', N'1'),
    (@porsche, N'Allianz', N'RCA 2023', N'ALL-10021', DATEADD(year, -3, @oggi), DATEADD(year, -2, @oggi), 15, 3900.00, NULL, N'1'),
    (@porsche, N'Allianz', N'RCA 2024', N'ALL-11890', DATEADD(year, -2, @oggi), DATEADD(year, -1, @oggi), 15, 4100.00, NULL, N'1'),
    (@porsche, N'Allianz', N'RCA 2025', N'ALL-13402', DATEADD(day, -165, @oggi), DATEADD(day, 200, @oggi), 15, 4350.00, N'In regola, circuito incluso.', N'1'),
    (@aston, N'AXA', N'RCA DB12', N'AXA-77621', DATEADD(day, -325, @oggi), DATEADD(day, 40, @oggi), 15, 3600.00, NULL, N'1'),
    (@sf90, N'Linear', N'RCA SF90', N'LIN-39004', DATEADD(day, -370, @oggi), DATEADD(day, -5, @oggi), 15, 7200.00, N'In periodo di tolleranza.', N'1'),
    (@huracan, N'Generali', N'RCA STO', N'GEN-90112', DATEADD(day, -275, @oggi), DATEADD(day, 90, @oggi), 15, 5400.00, N'Include cristalli e pista.', N'1');

INSERT INTO dbo.Bolli (
    Id_veicolo, inizio_validita, fine_validita, scadenza, nome, importo, note
) VALUES
    (@ferrari, DATEADD(year, -2, @oggi), DATEADD(day, -320, @oggi), DATEADD(day, -320, @oggi), N'Bollo 2024', 1850.00, NULL),
    (@ferrari, DATEADD(day, -320, @oggi), DATEADD(day, 45, @oggi), DATEADD(day, 45, @oggi), N'Bollo 2025', 1850.00, N'Superbollo incluso.'),
    (@lambo, DATEADD(day, -357, @oggi), DATEADD(day, 8, @oggi), DATEADD(day, 8, @oggi), N'Bollo 2025', 2480.00, N'Scade tra pochi giorni.'),
    (@porsche, DATEADD(year, -2, @oggi), DATEADD(year, -1, @oggi), DATEADD(year, -1, @oggi), N'Bollo 2024', 1620.00, NULL),
    (@porsche, DATEADD(year, -1, @oggi), DATEADD(day, 150, @oggi), DATEADD(day, 150, @oggi), N'Bollo 2025', 1620.00, NULL),
    (@aston, DATEADD(year, -2, @oggi), DATEADD(year, -1, @oggi), DATEADD(year, -1, @oggi), N'Bollo 2024', 1540.00, NULL),
    (@aston, DATEADD(year, -1, @oggi), DATEADD(day, -12, @oggi), DATEADD(day, -12, @oggi), N'Bollo 2025', 1540.00, N'Scaduto.'),
    (@sf90, DATEADD(day, -295, @oggi), DATEADD(day, 70, @oggi), DATEADD(day, 70, @oggi), N'Bollo 2025', 2710.00, NULL),
    (@huracan, DATEADD(day, -340, @oggi), DATEADD(day, 25, @oggi), DATEADD(day, 25, @oggi), N'Bollo 2025', 1960.00, NULL);

INSERT INTO dbo.Revisioni (
    nome, Id_Veicolo, Data_revisione, Data_scadenza, Esito, Km, Importo, Centro_revisione, Note
) VALUES
    (N'Revisione 2022', @ferrari, DATEADD(year, -4, @oggi), DATEADD(year, -2, @oggi), N'Regolare', 8400, 180.00, N'Officina Ferrari', NULL),
    (N'Revisione 2024', @ferrari, DATEADD(year, -2, @oggi), DATEADD(day, 80, @oggi), N'Regolare', 12100, 180.00, N'Officina Ferrari', N'Prossima tra circa 80 giorni.'),
    (N'Revisione 2024', @lambo, DATEADD(year, -2, @oggi), DATEADD(day, 200, @oggi), N'Regolare', 6200, 190.00, N'Lamborghini Centro', NULL),
    (N'Revisione 2022', @porsche, DATEADD(year, -4, @oggi), DATEADD(year, -2, @oggi), N'Regolare', 9100, 160.00, N'Porsche Centre', NULL),
    (N'Revisione 2024', @porsche, DATEADD(year, -2, @oggi), DATEADD(day, 300, @oggi), N'Regolare', 14800, 160.00, N'Porsche Centre', NULL),
    (N'Revisione 2022', @aston, DATEADD(year, -4, @oggi), DATEADD(year, -2, @oggi), N'Regolare', 11200, 170.00, N'Aston Martin Milano', NULL),
    (N'Revisione 2024', @aston, DATEADD(year, -2, @oggi), DATEADD(day, 18, @oggi), N'Regolare', 16400, 170.00, N'Aston Martin Milano', N'Scade a breve.'),
    (N'Revisione 2023', @sf90, DATEADD(year, -3, @oggi), DATEADD(day, 100, @oggi), N'Regolare', 7800, 180.00, N'Officina Ferrari', NULL),
    (N'Revisione 2020', @huracan, DATEADD(year, -6, @oggi), DATEADD(year, -4, @oggi), N'Regolare', 15200, 190.00, N'Lamborghini Centro', NULL),
    (N'Revisione 2022', @huracan, DATEADD(year, -4, @oggi), DATEADD(year, -2, @oggi), N'Regolare', 19800, 190.00, N'Lamborghini Centro', NULL),
    (N'Revisione 2024', @huracan, DATEADD(year, -2, @oggi), DATEADD(day, -30, @oggi), N'Regolare', 24100, 190.00, N'Lamborghini Centro', N'Scaduta.');

INSERT INTO dbo.Tagliando (
    Id_veicolo, nome, data_scadenza, scadenza_km, note, importo, Data_tagliando
) VALUES
    (@ferrari, N'Tagliando ufficiale', DATEADD(year, -2, @oggi), N'15000', NULL, 2100.00, DATEADD(year, -3, @oggi)),
    (@ferrari, N'Tagliando 15k', DATEADD(day, -8, @oggi), N'20000', N'Scaduto, da prenotare in officina Ferrari.', 2450.00, DATEADD(year, -1, @oggi)),
    (@lambo, N'Tagliando 10k', DATEADD(day, -400, @oggi), N'10000', NULL, 2800.00, DATEADD(day, -430, @oggi)),
    (@lambo, N'Tagliando ibrido', DATEADD(day, 60, @oggi), N'15000', NULL, 3200.00, DATEADD(day, -80, @oggi)),
    (@porsche, N'Tagliando 20k', DATEADD(year, -3, @oggi), N'20000', NULL, 1900.00, DATEADD(year, -3, @oggi)),
    (@porsche, N'Tagliando 30k', DATEADD(year, -1, @oggi), N'30000', NULL, 2100.00, DATEADD(year, -1, @oggi)),
    (@porsche, N'Tagliando GT3', DATEADD(day, 90, @oggi), N'40000', N'Include check Weissach.', 2350.00, DATEADD(day, -40, @oggi)),
    (@aston, N'Tagliando 20k', DATEADD(day, 120, @oggi), N'25000', NULL, 1800.00, DATEADD(day, -200, @oggi)),
    (@sf90, N'Tagliando 10k', DATEADD(year, -1, @oggi), N'10000', NULL, 3400.00, DATEADD(year, -1, @oggi)),
    (@sf90, N'Tagliando plug-in', DATEADD(day, 4, @oggi), N'15000', N'Scade tra pochi giorni. Batteria + V8.', 3900.00, DATEADD(day, -170, @oggi)),
    (@huracan, N'Tagliando 20k', DATEADD(year, -2, @oggi), N'20000', NULL, 2600.00, DATEADD(year, -2, @oggi)),
    (@huracan, N'Tagliando STO', DATEADD(day, 15, @oggi), N'25000', N'Freni CCM e set-up pista.', 3100.00, DATEADD(day, -350, @oggi));

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
