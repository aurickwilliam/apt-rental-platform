// Test-only, query-aware in-memory transport. No Supabase access or production imports.
// It applies recorded eligibility predicates before the base-row limit, like PostgREST.
export function createListingQueryFixture(getRows, { beforeRead = () => {}, fixedSections = [] } = {}) {
  const calls = [];
  const rpcCalls = [];
  return {
    calls, rpcCalls,
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      return { data: { sections: fixedSections }, error: null };
    },
    from(table) {
      if (table !== "apartments") throw new Error(`Unexpected fixture table: ${table}`);
      const call = { table, columns: "", ops: [] };
      calls.push(call);
      const query = {
        select(columns) { call.columns = columns; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            beforeRead(call);
            let rows = getRows().slice();
            for (const [method, column, value] of call.ops) {
              if (method === "is") rows = rows.filter(row => row[column] === value);
              if (method === "eq") rows = rows.filter(row => row[column] === value);
              if (method === "in") rows = rows.filter(row => value.includes(row[column]));
              if (method === "gte") rows = rows.filter(row => row[column] != null && row[column] >= value);
              if (method === "lte") rows = rows.filter(row => row[column] != null && row[column] <= value);
              if (method === "contains") rows = rows.filter(row => value.every(item => row[column]?.includes(item)));
            }
            const orders = call.ops.filter(([method, , options]) => method === "order" && !options?.foreignTable);
            rows.sort((a, b) => {
              for (const [, column, options] of orders) {
                const left = a[column], right = b[column];
                if (left === right) continue;
                if (left == null) return options?.nullsFirst ? -1 : 1;
                if (right == null) return options?.nullsFirst ? 1 : -1;
                return (left < right ? -1 : 1) * (options?.ascending === false ? -1 : 1);
              }
              return 0;
            });
            const limit = call.ops.find(([method, , options]) => method === "limit" && !options?.foreignTable)?.[1];
            if (limit !== undefined) rows = rows.slice(0, limit);
            return { data: rows, error: null };
          }).then(resolve, reject);
        },
      };
      for (const method of ["is", "eq", "in", "gte", "lte", "contains", "order", "limit"]) {
        query[method] = (...args) => { call.ops.push([method, ...args]); return query; };
      }
      return query;
    },
  };
}
