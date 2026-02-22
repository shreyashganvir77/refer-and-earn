-- Migration: Add NEEDS_UPDATE status and referral_messages table
-- Run this script to enable the Request Update flow

-- 1. Drop existing status check constraint
ALTER TABLE dbo.referral_requests
DROP CONSTRAINT IF EXISTS ck_referral_requests_status;

-- 2. Add NEEDS_UPDATE to allowed statuses
ALTER TABLE dbo.referral_requests
ADD CONSTRAINT ck_referral_requests_status
    CHECK (status IN (N'PENDING', N'ACCEPTED', N'COMPLETED', N'REJECTED', N'NEEDS_UPDATE'));

GO

-- 3. Create referral_messages table
CREATE TABLE dbo.referral_messages (
    message_id BIGINT IDENTITY(1,1) NOT NULL,
    referral_request_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    receiver_user_id BIGINT NOT NULL,
    message_text NVARCHAR(2000) NOT NULL,
    created_at DATETIME2(3) DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_referral_messages PRIMARY KEY CLUSTERED (message_id),
    CONSTRAINT fk_referral_messages_referral
        FOREIGN KEY (referral_request_id)
        REFERENCES dbo.referral_requests(request_id),
    CONSTRAINT fk_referral_messages_sender
        FOREIGN KEY (sender_user_id)
        REFERENCES dbo.users(user_id),
    CONSTRAINT fk_referral_messages_receiver
        FOREIGN KEY (receiver_user_id)
        REFERENCES dbo.users(user_id)
);

GO

-- Index for fetching messages by referral
CREATE NONCLUSTERED INDEX ix_referral_messages_referral_request_id
ON dbo.referral_messages (referral_request_id)
INCLUDE (created_at);
