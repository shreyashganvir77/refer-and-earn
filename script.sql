/* ============================================================
   Refer & Earn Platform - Azure SQL Schema (snake_case)
   - Users (email/password auth)
   - Companies
   - Referral Requests
   - Provider Ratings/Reviews
   ============================================================ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* =========================
   TABLE: companies
   ========================= */
CREATE TABLE dbo.companies (
    company_id         BIGINT IDENTITY(1,1) NOT NULL,
    company_name       NVARCHAR(200) NOT NULL,
    logo_url           NVARCHAR(500) NULL,
    industry           NVARCHAR(200) NULL,
    created_at         DATETIME2(3) NOT NULL CONSTRAINT df_companies_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_companies PRIMARY KEY CLUSTERED (company_id),
    CONSTRAINT uq_companies_company_name UNIQUE (company_name)
);
GO

/* =========================
   TABLE: users
   ========================= */
CREATE TABLE dbo.users (
    user_id                BIGINT IDENTITY(1,1) NOT NULL,
    full_name              NVARCHAR(200) NOT NULL,
    email                  NVARCHAR(320) NOT NULL,
    password_hash          NVARCHAR(255) NOT NULL,

    -- Professional details (optional)
    company_id             BIGINT NULL,
    role_designation       NVARCHAR(200) NULL,
    years_experience       INT NULL,

    -- Referral-provider metadata
    is_referral_provider   BIT NOT NULL CONSTRAINT df_users_is_referral_provider DEFAULT (0),
    provider_rating        DECIMAL(3,2) NULL,      -- denormalized/cached (e.g., 4.75)
    provider_rating_count  INT NOT NULL CONSTRAINT df_users_provider_rating_count DEFAULT (0),
    bio_description        NVARCHAR(1000) NULL,
    price_per_referral     DECIMAL(10,2) NULL,

    created_at             DATETIME2(3) NOT NULL CONSTRAINT df_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at             DATETIME2(3) NOT NULL CONSTRAINT df_users_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_users PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_company_id FOREIGN KEY (company_id) REFERENCES dbo.companies(company_id),

    CONSTRAINT ck_users_years_experience_nonnegative
        CHECK (years_experience IS NULL OR years_experience >= 0),

    CONSTRAINT ck_users_provider_rating_range
        CHECK (provider_rating IS NULL OR (provider_rating >= 0 AND provider_rating <= 5)),

    CONSTRAINT ck_users_price_per_referral_nonnegative
        CHECK (price_per_referral IS NULL OR price_per_referral >= 0)
);
GO

/* Helpful filtered index for provider listings */
CREATE INDEX ix_users_company_is_provider
ON dbo.users (company_id, is_referral_provider)
INCLUDE (full_name, role_designation, years_experience, provider_rating, provider_rating_count, price_per_referral);
GO

/* Login/support index (unique already enforces lookup) */
CREATE UNIQUE INDEX ux_users_email ON dbo.users (email);
GO


/* =========================
   TABLE: referral_requests
   ========================= */
CREATE TABLE dbo.referral_requests (
    request_id        BIGINT IDENTITY(1,1) NOT NULL,
    requester_user_id BIGINT NOT NULL,
    provider_user_id  BIGINT NOT NULL,
    company_id        BIGINT NOT NULL,

    status            NVARCHAR(20) NOT NULL CONSTRAINT df_referral_requests_status DEFAULT (N'pending'),
    price_agreed      DECIMAL(10,2) NOT NULL,

    created_at        DATETIME2(3) NOT NULL CONSTRAINT df_referral_requests_created_at DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2(3) NOT NULL CONSTRAINT df_referral_requests_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_referral_requests PRIMARY KEY CLUSTERED (request_id),

    CONSTRAINT fk_referral_requests_requester
        FOREIGN KEY (requester_user_id) REFERENCES dbo.users(user_id),

    CONSTRAINT fk_referral_requests_provider
        FOREIGN KEY (provider_user_id) REFERENCES dbo.users(user_id),

    CONSTRAINT fk_referral_requests_company
        FOREIGN KEY (company_id) REFERENCES dbo.companies(company_id),

    CONSTRAINT ck_referral_requests_status
        CHECK (status IN (N'pending', N'accepted', N'completed', N'rejected')),

    CONSTRAINT ck_referral_requests_price_agreed_nonnegative
        CHECK (price_agreed >= 0),

    CONSTRAINT ck_referral_requests_requester_not_provider
        CHECK (requester_user_id <> provider_user_id)
);
GO

/* Common query patterns: by requester, by provider, by company + status */
CREATE INDEX ix_referral_requests_requester_created
ON dbo.referral_requests (requester_user_id, created_at DESC);
GO

CREATE INDEX ix_referral_requests_provider_status_created
ON dbo.referral_requests (provider_user_id, status, created_at DESC);
GO

CREATE INDEX ix_referral_requests_company_status_created
ON dbo.referral_requests (company_id, status, created_at DESC);
GO


/* =========================
   TABLE: provider_reviews
   ========================= */
CREATE TABLE dbo.provider_reviews (
    rating_id        BIGINT IDENTITY(1,1) NOT NULL,
    provider_user_id BIGINT NOT NULL,
    given_by_user_id BIGINT NOT NULL,
    stars            TINYINT NOT NULL,
    review_text      NVARCHAR(2000) NULL,
    created_at       DATETIME2(3) NOT NULL CONSTRAINT df_provider_reviews_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_provider_reviews PRIMARY KEY CLUSTERED (rating_id),

    CONSTRAINT fk_provider_reviews_provider
        FOREIGN KEY (provider_user_id) REFERENCES dbo.users(user_id),

    CONSTRAINT fk_provider_reviews_given_by
        FOREIGN KEY (given_by_user_id) REFERENCES dbo.users(user_id),

    CONSTRAINT ck_provider_reviews_stars_range
        CHECK (stars BETWEEN 1 AND 5),

    CONSTRAINT ck_provider_reviews_not_self
        CHECK (provider_user_id <> given_by_user_id),

    -- Prevent duplicate reviews: one review per reviewer per provider
    CONSTRAINT uq_provider_reviews_provider_given_by UNIQUE (provider_user_id, given_by_user_id)
);
GO

CREATE INDEX ix_provider_reviews_provider_created
ON dbo.provider_reviews (provider_user_id, created_at DESC)
INCLUDE (stars);
GO

--last update 12:12 01-20-2026 index are pending