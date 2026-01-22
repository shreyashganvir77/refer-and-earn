-- Migration: Add Razorpay payment integration
-- Creates payments table and adds payment_status to referral_requests

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =========================
-- TABLE: payments
-- =========================
CREATE TABLE dbo.payments (
  payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  referral_request_id BIGINT NOT NULL,
  requester_user_id BIGINT NOT NULL,
  provider_user_id BIGINT NOT NULL,
  razorpay_order_id NVARCHAR(100) NOT NULL,
  razorpay_payment_id NVARCHAR(100) NULL,
  razorpay_signature NVARCHAR(255) NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  provider_amount DECIMAL(10,2) NOT NULL,
  status NVARCHAR(30) NOT NULL,
  -- CREATED | PAID | RELEASED | FAILED | REFUNDED
  created_at DATETIME2(3) DEFAULT sysutcdatetime(),
  updated_at DATETIME2(3) DEFAULT sysutcdatetime(),
  CONSTRAINT fk_payments_referral
    FOREIGN KEY (referral_request_id)
    REFERENCES referral_requests(request_id),
  CONSTRAINT fk_payments_requester
    FOREIGN KEY (requester_user_id)
    REFERENCES users(user_id),
  CONSTRAINT fk_payments_provider
    FOREIGN KEY (provider_user_id)
    REFERENCES users(user_id),
  CONSTRAINT ck_payments_status
    CHECK (status IN (N'CREATED', N'PAID', N'RELEASED', N'FAILED', N'REFUNDED')),
  CONSTRAINT ck_payments_amounts_nonnegative
    CHECK (total_amount >= 0 AND platform_fee >= 0 AND provider_amount >= 0)
);
GO

-- Index for faster lookups
CREATE INDEX ix_payments_referral_request_id ON dbo.payments(referral_request_id);
CREATE INDEX ix_payments_status ON dbo.payments(status);
CREATE INDEX ix_payments_razorpay_order_id ON dbo.payments(razorpay_order_id);
GO

-- =========================
-- ALTER: referral_requests
-- Add payment_status column
-- =========================
ALTER TABLE dbo.referral_requests
ADD payment_status NVARCHAR(30) NOT NULL
    CONSTRAINT df_referral_payment_status DEFAULT 'UNPAID';
GO

-- Add check constraint for payment_status
ALTER TABLE dbo.referral_requests
ADD CONSTRAINT ck_referral_payment_status
    CHECK (payment_status IN (N'UNPAID', N'PAID', N'RELEASED', N'REFUNDED'));
GO

-- Update existing records to have UNPAID status
UPDATE dbo.referral_requests
SET payment_status = 'UNPAID'
WHERE payment_status IS NULL;
GO
