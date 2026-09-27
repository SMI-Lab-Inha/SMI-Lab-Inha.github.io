/** UTC deadline is inclusive. Rebuild daily so static pages can expire openings. */
export function isRecruitmentOpen(record, now = new Date()) {
  return record.active && (!record.openUntil || now.toISOString().slice(0, 10) <= record.openUntil);
}
