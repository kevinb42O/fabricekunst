import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRange,
  combineOverviewReports,
  legacyOverviewFor,
  overviewFor,
} from '../api/admin-analytics.js';

const event = ({ id, visitId, receivedAt, eventName = 'page_view', pagePath = '/' }) => ({
  id,
  visit_id: visitId,
  event_name: eventName,
  occurred_at: receivedAt,
  received_at: receivedAt,
  page_path: pagePath,
  properties: {},
  device_type: 'desktop',
  referrer_origin: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
});

test('24-hour reports count recent visits and produce hourly buckets', () => {
  const now = new Date('2026-08-24T06:15:00.000Z');
  const range = buildRange('24h', now, null);
  const report = overviewFor([
    event({ id: 1, visitId: 'visit-a', receivedAt: '2026-08-23T07:10:00.000Z' }),
    event({ id: 2, visitId: 'visit-a', receivedAt: '2026-08-23T07:12:00.000Z', eventName: 'scroll_depth' }),
    event({ id: 3, visitId: 'visit-b', receivedAt: '2026-08-24T03:27:00.000Z' }),
  ], range);

  assert.equal(range.granularity, 'hour');
  assert.equal(report.summary.sessions, 2);
  assert.equal(report.summary.pageViews, 2);
  assert.equal(report.series.length, 25);
  assert.equal(report.series.find((row) => row.date === '2026-08-23T07:00:00.000Z').sessions, 1);
  assert.equal(report.series.find((row) => row.date === '2026-08-24T03:00:00.000Z').sessions, 1);
});

test('overview combines the non-overlapping legacy and current tracker periods', () => {
  const range = buildRange('7d', new Date('2026-08-24T06:15:00.000Z'), null);
  const current = overviewFor([
    event({ id: 1, visitId: 'visit-new', receivedAt: '2026-08-24T03:27:00.000Z', pagePath: '/collectie' }),
  ], range);
  const legacy = legacyOverviewFor([
    { id: 10, session_id: 'legacy-visit', created_at: '2026-08-19T10:00:00.000Z', page_url: '/collectie' },
  ], range);
  const combined = combineOverviewReports(current, legacy);

  assert.equal(combined.summary.sessions, 2);
  assert.equal(combined.summary.pageViews, 2);
  assert.equal(combined.breakdowns.pages[0].sessions, 2);
  assert.equal(combined.breakdowns.pages[0].pageViews, 2);
  assert.equal(combined.series.reduce((sum, row) => sum + row.sessions, 0), 2);
});
