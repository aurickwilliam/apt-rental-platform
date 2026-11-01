// In-memory stand-in for the browser Supabase client. The fixture calls the
// same methods as the production components, but nothing leaves the page:
// reads resolve to empty results and writes are recorded for assertions.
const verificationRow = null;

function createQuery(table) {
  let updating = false;
  const result = () => {
    if (updating) return { data: null, error: null };
    if (table === "apartment_verifications") {
      return { data: verificationRow, error: null };
    }
    return { data: [], error: null };
  };

  const builder = {
    select: () => builder,
    insert: () => builder,
    update: (values) => {
      updating = true;
      window.fixtureWrites.push({ table, values });
      return builder;
    },
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () =>
      Promise.resolve({
        data: table === "apartment_verifications" ? verificationRow : null,
        error: null,
      }),
    single: () => Promise.resolve(result()),
    // The production code awaits the builder itself, so the chain is thenable.
    then: (onFulfilled, onRejected) => Promise.resolve(result()).then(onFulfilled, onRejected),
  };

  return builder;
}

export function createBrowserClient() {
  return {
    from: (table) => createQuery(table),
    rpc: async (name) => {
      window.fixtureRpcs.push(name);
      return { data: name === "validate_camanava_location", error: null };
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: null, error: new Error("Not part of this fixture.") }),
      }),
    },
  };
}
