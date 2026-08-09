const normalizeTransitionId = (itemId) => String(itemId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');

export const getArtworkImageTransitionName = (itemId) => `artwork-image-${normalizeTransitionId(itemId)}`;
export const getArtworkTitleTransitionName = (itemId) => `artwork-title-${normalizeTransitionId(itemId)}`;