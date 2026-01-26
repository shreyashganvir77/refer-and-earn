-- Migration: Add phone_number to users (for provider contact / Razorpay)
-- Run once. Safe to re-run: checks for column existence.

IF COL_LENGTH('dbo.users', 'phone_number') IS NULL
BEGIN
  ALTER TABLE dbo.users
  ADD phone_number NVARCHAR(20) NULL;
END
GO
