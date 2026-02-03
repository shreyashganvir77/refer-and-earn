SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[companies](
	[company_id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_name] [nvarchar](200) NOT NULL,
	[logo_url] [nvarchar](500) NULL,
	[industry] [nvarchar](200) NULL,
	[created_at] [datetime2](3) NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[companies] ADD  CONSTRAINT [pk_companies] PRIMARY KEY CLUSTERED 
(
	[company_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[companies] ADD  CONSTRAINT [uq_companies_company_name] UNIQUE NONCLUSTERED 
(
	[company_name] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[companies] ADD  CONSTRAINT [df_companies_created_at]  DEFAULT (sysutcdatetime()) FOR [created_at]
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[company_domains](
	[domain_id] [bigint] IDENTITY(1,1) NOT NULL,
	[company_id] [bigint] NOT NULL,
	[domain] [nvarchar](255) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](3) NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[company_domains] ADD  CONSTRAINT [pk_company_domains] PRIMARY KEY CLUSTERED 
(
	[domain_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_company_domains_company_id] ON [dbo].[company_domains]
(
	[company_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[company_domains] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[company_domains] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[company_domains]  WITH CHECK ADD  CONSTRAINT [fk_company_domains_company] FOREIGN KEY([company_id])
REFERENCES [dbo].[companies] ([company_id])
GO
ALTER TABLE [dbo].[company_domains] CHECK CONSTRAINT [fk_company_domains_company]
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments](
	[payment_id] [bigint] IDENTITY(1,1) NOT NULL,
	[referral_request_id] [bigint] NOT NULL,
	[requester_user_id] [bigint] NOT NULL,
	[provider_user_id] [bigint] NOT NULL,
	[razorpay_order_id] [nvarchar](100) NOT NULL,
	[razorpay_payment_id] [nvarchar](100) NULL,
	[razorpay_signature] [nvarchar](255) NULL,
	[total_amount] [decimal](10, 2) NOT NULL,
	[platform_fee] [decimal](10, 2) NOT NULL,
	[provider_amount] [decimal](10, 2) NOT NULL,
	[status] [nvarchar](30) NOT NULL,
	[created_at] [datetime2](3) NULL,
	[updated_at] [datetime2](3) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[payments] ADD PRIMARY KEY CLUSTERED 
(
	[payment_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [ix_payments_razorpay_order_id] ON [dbo].[payments]
(
	[razorpay_order_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_payments_referral_request_id] ON [dbo].[payments]
(
	[referral_request_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [ix_payments_status] ON [dbo].[payments]
(
	[status] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [fk_payments_provider] FOREIGN KEY([provider_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [fk_payments_provider]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [fk_payments_referral] FOREIGN KEY([referral_request_id])
REFERENCES [dbo].[referral_requests] ([request_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [fk_payments_referral]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [fk_payments_requester] FOREIGN KEY([requester_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [fk_payments_requester]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [ck_payments_amounts_nonnegative] CHECK  (([total_amount]>=(0) AND [platform_fee]>=(0) AND [provider_amount]>=(0)))
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [ck_payments_amounts_nonnegative]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [ck_payments_status] CHECK  (([status]=N'REFUNDED' OR [status]=N'FAILED' OR [status]=N'RELEASED' OR [status]=N'PAID' OR [status]=N'CREATED'))
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [ck_payments_status]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[provider_reviews](
	[rating_id] [bigint] IDENTITY(1,1) NOT NULL,
	[provider_user_id] [bigint] NOT NULL,
	[given_by_user_id] [bigint] NOT NULL,
	[stars] [tinyint] NOT NULL,
	[review_text] [nvarchar](2000) NULL,
	[created_at] [datetime2](3) NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[provider_reviews] ADD  CONSTRAINT [pk_provider_reviews] PRIMARY KEY CLUSTERED 
(
	[rating_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[provider_reviews] ADD  CONSTRAINT [uq_provider_reviews_provider_given_by] UNIQUE NONCLUSTERED 
(
	[provider_user_id] ASC,
	[given_by_user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[provider_reviews] ADD  CONSTRAINT [df_provider_reviews_created_at]  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[provider_reviews]  WITH CHECK ADD  CONSTRAINT [fk_provider_reviews_given_by] FOREIGN KEY([given_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[provider_reviews] CHECK CONSTRAINT [fk_provider_reviews_given_by]
GO
ALTER TABLE [dbo].[provider_reviews]  WITH CHECK ADD  CONSTRAINT [fk_provider_reviews_provider] FOREIGN KEY([provider_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[provider_reviews] CHECK CONSTRAINT [fk_provider_reviews_provider]
GO
ALTER TABLE [dbo].[provider_reviews]  WITH CHECK ADD  CONSTRAINT [ck_provider_reviews_not_self] CHECK  (([provider_user_id]<>[given_by_user_id]))
GO
ALTER TABLE [dbo].[provider_reviews] CHECK CONSTRAINT [ck_provider_reviews_not_self]
GO
ALTER TABLE [dbo].[provider_reviews]  WITH CHECK ADD  CONSTRAINT [ck_provider_reviews_stars_range] CHECK  (([stars]>=(1) AND [stars]<=(5)))
GO
ALTER TABLE [dbo].[provider_reviews] CHECK CONSTRAINT [ck_provider_reviews_stars_range]
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[referral_requests](
	[request_id] [bigint] IDENTITY(1,1) NOT NULL,
	[requester_user_id] [bigint] NOT NULL,
	[provider_user_id] [bigint] NOT NULL,
	[company_id] [bigint] NOT NULL,
	[status] [nvarchar](20) NOT NULL,
	[price_agreed] [decimal](10, 2) NOT NULL,
	[created_at] [datetime2](3) NOT NULL,
	[updated_at] [datetime2](3) NOT NULL,
	[resume_link] [nvarchar](1000) NULL,
	[job_id] [nvarchar](200) NULL,
	[job_title] [nvarchar](300) NULL,
	[phone_number] [nvarchar](20) NULL,
	[referral_summary] [nvarchar](2000) NULL,
	[requester_email_sent_at] [datetime2](3) NULL,
	[provider_email_sent_at] [datetime2](3) NULL,
	[payment_status] [nvarchar](30) NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[referral_requests] ADD  CONSTRAINT [pk_referral_requests] PRIMARY KEY CLUSTERED 
(
	[request_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[referral_requests] ADD  CONSTRAINT [df_referral_requests_status]  DEFAULT (N'pending') FOR [status]
GO
ALTER TABLE [dbo].[referral_requests] ADD  CONSTRAINT [df_referral_requests_created_at]  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[referral_requests] ADD  CONSTRAINT [df_referral_requests_updated_at]  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[referral_requests] ADD  CONSTRAINT [df_referral_payment_status]  DEFAULT ('UNPAID') FOR [payment_status]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [fk_referral_requests_company] FOREIGN KEY([company_id])
REFERENCES [dbo].[companies] ([company_id])
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [fk_referral_requests_company]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [fk_referral_requests_provider] FOREIGN KEY([provider_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [fk_referral_requests_provider]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [fk_referral_requests_requester] FOREIGN KEY([requester_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [fk_referral_requests_requester]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [ck_referral_payment_status] CHECK  (([payment_status]=N'REFUNDED' OR [payment_status]=N'RELEASED' OR [payment_status]=N'PAID' OR [payment_status]=N'UNPAID'))
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [ck_referral_payment_status]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [ck_referral_requests_price_agreed_nonnegative] CHECK  (([price_agreed]>=(0)))
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [ck_referral_requests_price_agreed_nonnegative]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [ck_referral_requests_requester_not_provider] CHECK  (([requester_user_id]<>[provider_user_id]))
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [ck_referral_requests_requester_not_provider]
GO
ALTER TABLE [dbo].[referral_requests]  WITH CHECK ADD  CONSTRAINT [ck_referral_requests_status] CHECK  (([status]=N'REJECTED' OR [status]=N'COMPLETED' OR [status]=N'ACCEPTED' OR [status]=N'PENDING'))
GO
ALTER TABLE [dbo].[referral_requests] CHECK CONSTRAINT [ck_referral_requests_status]
GO


SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[support_tickets](
	[ticket_id] [bigint] IDENTITY(1,1) NOT NULL,
	[referral_request_id] [bigint] NOT NULL,
	[raised_by_user_id] [bigint] NOT NULL,
	[issue_type] [nvarchar](100) NOT NULL,
	[description] [nvarchar](2000) NOT NULL,
	[status] [nvarchar](30) NOT NULL,
	[created_at] [datetime2](3) NOT NULL,
	[updated_at] [datetime2](3) NOT NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[support_tickets] ADD  CONSTRAINT [pk_support_tickets] PRIMARY KEY CLUSTERED 
(
	[ticket_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[support_tickets] ADD  CONSTRAINT [uq_support_ticket_one_per_referral] UNIQUE NONCLUSTERED 
(
	[referral_request_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [ix_support_tickets_referral] ON [dbo].[support_tickets]
(
	[referral_request_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
CREATE NONCLUSTERED INDEX [ix_support_tickets_status] ON [dbo].[support_tickets]
(
	[status] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, DROP_EXISTING = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[support_tickets] ADD  CONSTRAINT [df_support_tickets_status]  DEFAULT ('OPEN') FOR [status]
GO
ALTER TABLE [dbo].[support_tickets] ADD  CONSTRAINT [df_support_tickets_created_at]  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[support_tickets] ADD  CONSTRAINT [df_support_tickets_updated_at]  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[support_tickets]  WITH CHECK ADD  CONSTRAINT [fk_support_ticket_referral] FOREIGN KEY([referral_request_id])
REFERENCES [dbo].[referral_requests] ([request_id])
GO
ALTER TABLE [dbo].[support_tickets] CHECK CONSTRAINT [fk_support_ticket_referral]
GO
ALTER TABLE [dbo].[support_tickets]  WITH CHECK ADD  CONSTRAINT [fk_support_ticket_user] FOREIGN KEY([raised_by_user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[support_tickets] CHECK CONSTRAINT [fk_support_ticket_user]
GO
ALTER TABLE [dbo].[support_tickets]  WITH CHECK ADD  CONSTRAINT [ck_support_tickets_status] CHECK  (([status]='RESOLVED' OR [status]='OPEN'))
GO
ALTER TABLE [dbo].[support_tickets] CHECK CONSTRAINT [ck_support_tickets_status]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[user_id] [bigint] IDENTITY(1,1) NOT NULL,
	[full_name] [nvarchar](200) NOT NULL,
	[email] [nvarchar](320) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[company_id] [bigint] NULL,
	[role_designation] [nvarchar](200) NULL,
	[years_experience] [int] NULL,
	[is_referral_provider] [bit] NOT NULL,
	[provider_rating] [decimal](3, 2) NULL,
	[provider_rating_count] [int] NOT NULL,
	[bio_description] [nvarchar](1000) NULL,
	[price_per_referral] [decimal](10, 2) NULL,
	[created_at] [datetime2](3) NOT NULL,
	[updated_at] [datetime2](3) NOT NULL,
	[picture_url] [nvarchar](500) NULL,
	[company_email] [nvarchar](320) NULL,
	[is_company_email_verified] [bit] NOT NULL,
	[razorpay_contact_id] [nvarchar](100) NULL,
	[razorpay_fund_account_id] [nvarchar](100) NULL,
	[payout_status] [nvarchar](30) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [pk_users] PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [uq_users_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [df_users_is_referral_provider]  DEFAULT ((0)) FOR [is_referral_provider]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [df_users_provider_rating_count]  DEFAULT ((0)) FOR [provider_rating_count]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [df_users_created_at]  DEFAULT (sysutcdatetime()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [df_users_updated_at]  DEFAULT (sysutcdatetime()) FOR [updated_at]
GO
ALTER TABLE [dbo].[users] ADD  CONSTRAINT [df_users_company_email_verified]  DEFAULT ((0)) FOR [is_company_email_verified]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [fk_users_company_id] FOREIGN KEY([company_id])
REFERENCES [dbo].[companies] ([company_id])
GO
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [fk_users_company_id]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [ck_users_price_per_referral_nonnegative] CHECK  (([price_per_referral] IS NULL OR [price_per_referral]>=(0)))
GO
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [ck_users_price_per_referral_nonnegative]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [ck_users_provider_rating_range] CHECK  (([provider_rating] IS NULL OR [provider_rating]>=(0) AND [provider_rating]<=(5)))
GO
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [ck_users_provider_rating_range]
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD  CONSTRAINT [ck_users_years_experience_nonnegative] CHECK  (([years_experience] IS NULL OR [years_experience]>=(0)))
GO
ALTER TABLE [dbo].[users] CHECK CONSTRAINT [ck_users_years_experience_nonnegative]
GO
