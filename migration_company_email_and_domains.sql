-- Migration: Company email + company_domains
-- Extends users minimally; creates company_domains for domain validation.
-- Run against existing DB. Do NOT recreate users table.

-- 1. Extend users (ADD COLUMNS ONLY)
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'company_email'
)
BEGIN
  ALTER TABLE dbo.users
  ADD company_email NVARCHAR(320) NULL;
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.users') AND name = N'is_company_email_verified'
)
BEGIN
  ALTER TABLE dbo.users
  ADD is_company_email_verified BIT NOT NULL
    CONSTRAINT df_users_company_email_verified DEFAULT 0;
END
GO

-- 2. Company → Domain mapping (REQUIRED new table)
IF OBJECT_ID(N'dbo.company_domains', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.company_domains (
    domain_id BIGINT IDENTITY(1,1) NOT NULL,
    company_id BIGINT NOT NULL,
    domain NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_company_domains PRIMARY KEY (domain_id),
    CONSTRAINT fk_company_domains_company
      FOREIGN KEY (company_id)
      REFERENCES dbo.companies(company_id)
  );

  CREATE NONCLUSTERED INDEX ix_company_domains_company_id
    ON dbo.company_domains(company_id);
END
GO

-- 3. Example seed (adjust company_id if your companies differ)
-- Ensure companies 1, 2 exist. Example: 1=Amazon, 2=Microsoft
IF EXISTS (SELECT 1 FROM dbo.companies WHERE company_id = 1)
  AND NOT EXISTS (SELECT 1 FROM dbo.company_domains WHERE company_id = 1 AND domain = N'amazon.com')
  INSERT INTO dbo.company_domains (company_id, domain) VALUES (1, N'amazon.com');
IF EXISTS (SELECT 1 FROM dbo.companies WHERE company_id = 2)
  AND NOT EXISTS (SELECT 1 FROM dbo.company_domains WHERE company_id = 2 AND domain = N'microsoft.com')
  INSERT INTO dbo.company_domains (company_id, domain) VALUES (2, N'microsoft.com');
IF EXISTS (SELECT 1 FROM dbo.companies WHERE company_id = 2)
  AND NOT EXISTS (SELECT 1 FROM dbo.company_domains WHERE company_id = 2 AND domain = N'linkedin.com')
  INSERT INTO dbo.company_domains (company_id, domain) VALUES (2, N'linkedin.com');
GO
