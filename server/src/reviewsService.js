const { getPool, sql } = require('./db');
const { parseBigIntParam } = require('./utils');

/**
 * Create a provider review for a completed referral (requester only).
 * Validates: referral COMPLETED, requester is giver, no existing review for this requester→provider.
 * Updates provider aggregate rating with incremental formula.
 */
async function createReviewForReferral(referralRequestId, requesterUserId, { stars, review_text }) {
  const requestId = parseBigIntParam(referralRequestId);
  const userId = parseBigIntParam(requesterUserId);
  if (!requestId || !userId) {
    throw new Error('Invalid referral_request_id or user');
  }
  const s = stars == null ? NaN : Number(stars);
  if (!Number.isInteger(s) || s < 1 || s > 5) {
    throw new Error('stars must be 1-5');
  }
  const text = (review_text != null && typeof review_text === 'string') ? review_text.trim() || null : null;

  const pool = await getPool();

  const refResult = await pool.request()
    .input('request_id', sql.BigInt, requestId)
    .query(`
      SELECT TOP 1 request_id, status, requester_user_id, provider_user_id
      FROM referral_requests
      WHERE request_id = @request_id
    `);
  const ref = refResult.recordset[0];
  if (!ref) {
    throw new Error('Referral request not found');
  }
  if ((ref.status || '').toUpperCase() !== 'COMPLETED') {
    const err = new Error('Referral must be COMPLETED to submit a review');
    err.errorCode = 'REFERRAL_NOT_COMPLETED';
    throw err;
  }
  if (String(ref.requester_user_id) !== String(userId)) {
    throw new Error('Only the requester can submit a review for this referral');
  }
  const providerUserId = ref.provider_user_id;
  if (String(providerUserId) === String(userId)) {
    throw new Error('Cannot review yourself');
  }

  const existing = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('given_by_user_id', sql.BigInt, userId)
    .query(`
      SELECT TOP 1 rating_id FROM provider_reviews
      WHERE provider_user_id = @provider_user_id AND given_by_user_id = @given_by_user_id
    `);
  if (existing.recordset.length > 0) {
    const err = new Error('You have already submitted a review for this provider');
    err.errorCode = 'REVIEW_ALREADY_EXISTS';
    throw err;
  }

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);

    await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('given_by_user_id', sql.BigInt, userId)
      .input('stars', sql.TinyInt, s)
      .input('review_text', sql.NVarChar(2000), text)
      .query(`
        INSERT INTO provider_reviews (provider_user_id, given_by_user_id, stars, review_text, created_at)
        VALUES (@provider_user_id, @given_by_user_id, @stars, @review_text, SYSUTCDATETIME())
      `);

    await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('stars', sql.TinyInt, s)
      .query(`
        UPDATE users
        SET
          provider_rating =
            (
              (COALESCE(provider_rating, 0) * provider_rating_count + @stars)
              / (provider_rating_count + 1)
            ),
          provider_rating_count = provider_rating_count + 1,
          updated_at = SYSUTCDATETIME()
        WHERE user_id = @provider_user_id
      `);

    await transaction.commit();
  } catch (e) {
    await transaction.rollback();
    throw e;
  }

  return { success: true };
}

/**
 * Create a provider review (generic: by provider ID; used by POST /providers/:id/reviews)
 */
async function createReview(givenByUserId, providerUserId, { stars, review_text }) {
  if (providerUserId === givenByUserId) {
    throw new Error('Cannot review yourself');
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new Error('Stars must be 1-5');
  }

  const pool = await getPool();

  // Enforce "one review per provider per user"
  // Ensure requester has at least one completed referral with this provider
  const completedReferral = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('requester_user_id', sql.BigInt, givenByUserId)
    .query(`
      SELECT TOP 1 request_id FROM referral_requests
      WHERE provider_user_id = @provider_user_id
        AND requester_user_id = @requester_user_id
        AND status = 'COMPLETED'
    `);
  if (completedReferral.recordset.length === 0) {
    throw new Error('Rating allowed only after a completed referral');
  }

  const existing = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .input('given_by_user_id', sql.BigInt, givenByUserId)
    .query(`
      SELECT TOP 1 * FROM provider_reviews
      WHERE provider_user_id = @provider_user_id
        AND given_by_user_id = @given_by_user_id
    `);
  if (existing.recordset.length > 0) {
    throw new Error('Review already exists');
  }

  const transaction = new sql.Transaction(await getPool());
  try {
    await transaction.begin();
    const reqTx = new sql.Request(transaction);

    const createdResult = await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('given_by_user_id', sql.BigInt, givenByUserId)
      .input('stars', sql.TinyInt, stars)
      .input('review_text', sql.NVarChar(2000), review_text)
      .query(`
        INSERT INTO provider_reviews
          (provider_user_id, given_by_user_id, stars, review_text, created_at)
        OUTPUT INSERTED.*
        VALUES
          (@provider_user_id, @given_by_user_id, @stars, @review_text, SYSUTCDATETIME())
      `);

    const aggResult = await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .query(`
        SELECT AVG(CAST(stars AS DECIMAL(10,2))) AS avg_stars,
               COUNT(*) AS count_stars
        FROM provider_reviews
        WHERE provider_user_id = @provider_user_id
      `);

    const agg = aggResult.recordset[0] || { avg_stars: null, count_stars: 0 };

    await reqTx
      .input('provider_user_id', sql.BigInt, providerUserId)
      .input('provider_rating', sql.Decimal(3, 2), agg.avg_stars)
      .input('provider_rating_count', sql.Int, agg.count_stars)
      .query(`
        UPDATE users
        SET provider_rating = @provider_rating,
            provider_rating_count = @provider_rating_count,
            updated_at = SYSUTCDATETIME()
        WHERE user_id = @provider_user_id
      `);

    await transaction.commit();

    return {
      review: createdResult.recordset[0],
      provider_rating: agg.avg_stars,
      provider_rating_count: agg.count_stars,
    };
  } catch (e) {
    await transaction.rollback();
    throw new Error('Failed to create review');
  }
}

/**
 * Get reviews for a provider
 */
async function getProviderReviews(providerUserId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('provider_user_id', sql.BigInt, providerUserId)
    .query(`
      SELECT * FROM provider_reviews
      WHERE provider_user_id = @provider_user_id
      ORDER BY created_at DESC
    `);
  return { reviews: result.recordset };
}

module.exports = {
  createReview,
  createReviewForReferral,
  getProviderReviews,
};
