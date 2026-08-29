const SETTING_KEY = 'rembrandt_project_preview_links';
const MAX_STORED_LINKS = 20;

const parseLinks = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') : [];
  } catch {
    return [];
  }
};

export async function readPreviewLinks(supabase) {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value, updated_at')
    .eq('key', SETTING_KEY)
    .maybeSingle();
  if (error) throw error;
  return { links: parseLinks(data?.value), updatedAt: data?.updated_at || null };
}

export async function writePreviewLinks(supabase, links) {
  const updatedAt = new Date().toISOString();
  const normalized = [...links]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, MAX_STORED_LINKS);
  const { error } = await supabase.from('admin_settings').upsert({
    key: SETTING_KEY,
    value: JSON.stringify(normalized),
    updated_at: updatedAt,
  });
  if (error) throw error;
  return normalized;
}

export const activePreviewLink = (links, now = Date.now()) =>
  links.find((entry) =>
    !entry.revokedAt &&
    Number.isFinite(new Date(entry.expiresAt).getTime()) &&
    new Date(entry.expiresAt).getTime() > now,
  ) || null;
