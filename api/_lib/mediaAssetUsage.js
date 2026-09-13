const normalizeUsages = ({ consumerType, consumerId, usages = [] }) => {
  const unique = new Map();
  for (const usage of usages) {
    if (!usage?.assetId || !usage?.placement) continue;
    unique.set(`${usage.assetId}:${usage.placement}`, {
      asset_id: usage.assetId,
      consumer_type: consumerType,
      consumer_id: consumerId,
      placement: usage.placement,
      updated_at: new Date().toISOString(),
    });
  }
  return unique;
};

/** Stage additions before making a page live. Failure can only leave a safe,
 * extra blocking row; it can never make an in-use asset deletable. */
export async function stageMediaAssetUsages(supabase, input) {
  const { consumerType, consumerId } = input;
  const unique = normalizeUsages(input);
  const { data: existing, error: existingError } = await supabase
    .from("media_asset_usages")
    .select("asset_id, placement")
    .eq("consumer_type", consumerType)
    .eq("consumer_id", consumerId);
  if (existingError) throw existingError;
  if (unique.size) {
    const { error: upsertError } = await supabase
      .from("media_asset_usages")
      .upsert([...unique.values()], {
        onConflict: "asset_id,consumer_type,consumer_id,placement",
      });
    if (upsertError) throw upsertError;
  }
  return { consumerType, consumerId, unique, existing: existing || [] };
}

/** Remove obsolete rows only after the authoritative page save succeeded. */
export async function finalizeMediaAssetUsageStage(supabase, stage) {
  const stale = stage.existing.filter(
    (entry) => !stage.unique.has(`${entry.asset_id}:${entry.placement}`),
  );
  for (const entry of stale) {
    const { error } = await supabase
      .from("media_asset_usages")
      .delete()
      .eq("consumer_type", stage.consumerType)
      .eq("consumer_id", stage.consumerId)
      .eq("asset_id", entry.asset_id)
      .eq("placement", entry.placement);
    if (error) throw error;
  }
}

/** Undo only rows introduced by an unsuccessful staged save. Existing rows
 * remain untouched, so a rollback cannot make a pre-existing live usage
 * deletable. */
export async function rollbackMediaAssetUsageStage(supabase, stage) {
  const existing = new Set(
    stage.existing.map((entry) => `${entry.asset_id}:${entry.placement}`),
  );
  const introduced = [...stage.unique.values()].filter(
    (entry) => !existing.has(`${entry.asset_id}:${entry.placement}`),
  );
  for (const entry of introduced) {
    const { error } = await supabase
      .from("media_asset_usages")
      .delete()
      .eq("consumer_type", stage.consumerType)
      .eq("consumer_id", stage.consumerId)
      .eq("asset_id", entry.asset_id)
      .eq("placement", entry.placement);
    if (error) throw error;
  }
}

/** Safe standalone replacement for flows without a separate page transaction. */
export async function replaceMediaAssetUsages(supabase, input) {
  const stage = await stageMediaAssetUsages(supabase, input);
  await finalizeMediaAssetUsageStage(supabase, stage);
}
