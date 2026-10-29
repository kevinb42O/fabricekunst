import { requireActiveAdmin } from './adminAuth.js';
import { dashboardUpdates } from './dashboardUpdates.js';

export const createDashboardUpdatesHandler = (authorize = requireActiveAdmin) => async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const authorization = await authorize(req);
    if (!authorization.ok) return res.status(authorization.status).json({ error: authorization.error });
    return res.status(200).json({ updates: dashboardUpdates });
  } catch (error) {
    console.error('Dashboard updates unavailable:', error.message);
    return res.status(500).json({ error: 'De updates konden niet worden geladen.' });
  }
};

export default createDashboardUpdatesHandler();
