-- Migration: Add Razorpay payout fields to users (Contact, Fund Account, status)
-- Run once. Safe to re-run: checks for column existence.
--
-- Also set in .env: RAZORPAY_ACCOUNT_NUMBER (RazorpayX customer identifier / current account number for payouts)

IF COL_LENGTH('dbo.users', 'razorpay_contact_id') IS NULL
BEGIN
  ALTER TABLE dbo.users
  ADD razorpay_contact_id NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.users', 'razorpay_fund_account_id') IS NULL
BEGIN
  ALTER TABLE dbo.users
  ADD razorpay_fund_account_id NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.users', 'payout_status') IS NULL
BEGIN
  ALTER TABLE dbo.users
  ADD payout_status NVARCHAR(30) NULL;
  -- Allowed: NOT_CREATED | CONTACT_CREATED | FUND_ACCOUNT_CREATED | ACTIVE
END
GO
