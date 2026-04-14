/* eslint-disable @typescript-eslint/no-explicit-any */
const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a table using pagination to bypass
 * PostgREST's default 1000-row limit.
 */
export async function fetchAllRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  columns: string,
  orderBy = "name"
): Promise<any[]> {
  const all: any[] = [];
  let from = 0;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy)
      .range(from, from + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}
