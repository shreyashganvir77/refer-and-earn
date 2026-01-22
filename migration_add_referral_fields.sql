-- Migration: Add new fields to referral_requests table
-- Run this script to add the required columns for the enhanced referral flow

-- Add new columns for referral request details
ALTER TABLE dbo.referral_requests
ADD job_id NVARCHAR(200) NULL,
    job_title NVARCHAR(300) NULL,
    phone_number NVARCHAR(20) NULL,
    referral_summary NVARCHAR(2000) NULL;

-- Add email tracking columns
ALTER TABLE dbo.referral_requests
ADD requester_email_sent_at DATETIME2(3) NULL,
    provider_email_sent_at DATETIME2(3) NULL;

-- Update status constraint to use uppercase values
-- First, update existing data if needed
UPDATE dbo.referral_requests
SET status = UPPER(status)
WHERE status IN ('pending', 'completed', 'accepted', 'rejected');

-- Drop and recreate the check constraint for uppercase status values
ALTER TABLE dbo.referral_requests
DROP CONSTRAINT IF EXISTS ck_referral_requests_status;

ALTER TABLE dbo.referral_requests
ADD CONSTRAINT ck_referral_requests_status
    CHECK (status IN (N'PENDING', N'ACCEPTED', N'COMPLETED', N'REJECTED'));

GO
