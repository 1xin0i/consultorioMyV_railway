/** @format */

const MAX_LIMIT = 100;

const toPositiveInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

/**
 * Lee y sanea page / limit / search / sortField / sortOrder desde req.query.
 * El campo de orden solo se acepta si pertenece a `allowedSortFields`
 * (evita ordenar por columnas arbitrarias o inexistentes).
 *
 * @param {Object} query - req.query
 * @param {Object} options
 * @param {number} [options.defaultLimit=9]
 * @param {string} options.defaultSortField
 * @param {"ASC"|"DESC"} [options.defaultSortOrder="ASC"]
 * @param {string[]} options.allowedSortFields
 */
export const parsePagination = (
  query,
  { defaultLimit = 9, defaultSortField, defaultSortOrder = "ASC", allowedSortFields = [] },
) => {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), MAX_LIMIT);
  const search = typeof query.search === "string" ? query.search.trim() : "";

  const sortField = allowedSortFields.includes(query.sortField) ? query.sortField : defaultSortField;
  const sortOrder = String(query.sortOrder || defaultSortOrder).toUpperCase() === "DESC" ? "DESC" : "ASC";

  return { page, limit, offset: (page - 1) * limit, search, sortField, sortOrder };
};

/** Arma el objeto `meta` estándar de las respuestas paginadas. */
export const buildPaginationMeta = (count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  return {
    total: count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

