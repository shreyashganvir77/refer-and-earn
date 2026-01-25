-- Migration: support_tickets for post-completion concerns
-- One ticket per referral (uq_support_tickets_one_per_referral)

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.support_tickets', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.support_tickets (
    ticket_id BIGINT IDENTITY(1,1) NOT NULL,
    referral_request_id BIGINT NOT NULL,
    raised_by_user_id BIGINT NOT NULL,

    issue_type NVARCHAR(100) NOT NULL,
    description NVARCHAR(2000) NOT NULL,

    status NVARCHAR(30) NOT NULL CONSTRAINT df_support_tickets_status DEFAULT 'OPEN',
    created_at DATETIME2(3) NOT NULL CONSTRAINT df_support_tickets_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(3) NOT NULL CONSTRAINT df_support_tickets_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_support_tickets PRIMARY KEY (ticket_id),
    CONSTRAINT fk_support_ticket_referral
      FOREIGN KEY (referral_request_id)
      REFERENCES dbo.referral_requests(request_id),
    CONSTRAINT fk_support_ticket_user
      FOREIGN KEY (raised_by_user_id)
      REFERENCES dbo.users(user_id),
    CONSTRAINT uq_support_ticket_one_per_referral
      UNIQUE (referral_request_id),
    CONSTRAINT ck_support_tickets_status
      CHECK (status IN ('OPEN', 'RESOLVED'))
  );

  CREATE NONCLUSTERED INDEX ix_support_tickets_referral
    ON dbo.support_tickets(referral_request_id);
  CREATE NONCLUSTERED INDEX ix_support_tickets_status
    ON dbo.support_tickets(status);
END
GO
