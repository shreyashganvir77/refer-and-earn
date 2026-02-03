-- Add referral_price to companies table (platform sets price per company)
-- Batch 1: Add the column (must be in its own batch so it exists before the CHECK)
IF COL_LENGTH('dbo.companies', 'referral_price') IS NULL
BEGIN
  ALTER TABLE dbo.companies
  ADD referral_price DECIMAL(10, 2) NOT NULL
  CONSTRAINT df_companies_referral_price DEFAULT 0;
END
GO

-- Batch 2: Add check constraint (runs after column exists)
IF COL_LENGTH('dbo.companies', 'referral_price') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'ck_companies_referral_price_nonnegative'
  )
BEGIN
  ALTER TABLE dbo.companies
  ADD CONSTRAINT ck_companies_referral_price_nonnegative
  CHECK (referral_price >= 0);
END
GO
