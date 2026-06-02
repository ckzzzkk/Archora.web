/**
 * Reusable Supabase client mock factory for Vitest.
 *
 * Returns a chainable thenable builder — every method returns `this` so chains
 * like `.insert().select().single()` work without explicit per-call overrides.
 * Override the resolved value per-test via `builder.mockResolve({ data, error })`.
 */
import { vi } from 'vitest';

type MockFn = ReturnType<typeof vi.fn>;

export interface SupabaseMockAuth {
  getSession: MockFn;
  getUser: MockFn;
  signInWithPassword: MockFn;
  signUp: MockFn;
  signOut: MockFn;
  resetPasswordForEmail: MockFn;
  updateUser: MockFn;
  refreshSession: MockFn;
  onAuthStateChange: MockFn;
  admin: { deleteUser: MockFn };
}

export interface QueryBuilderMock {
  _result: { data: unknown; error: unknown };
  mockResolve: (result: { data: unknown; error: unknown }) => void;
  select: MockFn;
  insert: MockFn;
  update: MockFn;
  upsert: MockFn;
  delete: MockFn;
  eq: MockFn;
  neq: MockFn;
  not: MockFn;
  is: MockFn;
  in: MockFn;
  order: MockFn;
  limit: MockFn;
  range: MockFn;
  single: MockFn;
  maybeSingle: MockFn;
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>;
}

/** Build a chainable thenable query builder. Every method returns `this`. */
export function createQueryBuilder(
  defaultResult: { data: unknown; error: unknown } = { data: [], error: null },
): QueryBuilderMock {
  // Use a plain object with a shared mutable _result reference.
  // All chainable methods return the builder itself.
  // Tests set the response via builder.mockResolve({ data, error }).
  const builder = {
    _result: defaultResult,
    mockResolve(result: { data: unknown; error: unknown }) { builder._result = result; },

    // PromiseLike — `await builder` resolves at any chain depth
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(builder._result).then(resolve, reject);
    },

    select:      vi.fn(() => builder),
    insert:      vi.fn(() => builder),
    update:      vi.fn(() => builder),
    upsert:      vi.fn(() => builder),
    delete:      vi.fn(() => builder),
    eq:          vi.fn(() => builder),
    neq:         vi.fn(() => builder),
    not:         vi.fn(() => builder),
    is:          vi.fn(() => builder),
    in:          vi.fn(() => builder),
    order:       vi.fn(() => builder),
    limit:       vi.fn(() => builder),
    range:       vi.fn(() => builder),
    single:      vi.fn(() => Promise.resolve(builder._result)),
    maybeSingle: vi.fn(() => Promise.resolve(builder._result)),
  } as unknown as QueryBuilderMock;

  return builder;
}

export function createStorageMock(uploadResult = { data: { path: 'test/path' }, error: null }) {
  const bucketMock = {
    upload: vi.fn().mockResolvedValue(uploadResult),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.test/file.jpg' } }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
  };
  return {
    from: vi.fn().mockReturnValue(bucketMock),
    _bucket: bucketMock,
  };
}

export function createFunctionsMock(invokeResult = { data: { success: true }, error: null }) {
  return { invoke: vi.fn().mockResolvedValue(invokeResult) };
}

export function createChannelMock() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    send: vi.fn().mockResolvedValue('ok'),
    unsubscribe: vi.fn().mockResolvedValue('ok'),
  };
  return channel;
}

export function createSupabaseMock(overrides: {
  authOverrides?: Partial<SupabaseMockAuth>;
  defaultQueryResult?: { data: unknown; error: unknown };
  invokeResult?: { data: unknown; error: unknown };
  /** Per-table results: { tableName: { data, error } } */
  tableResults?: Record<string, { data: unknown; error: unknown }>;
} = {}) {
  const defaultResult = overrides.defaultQueryResult ?? { data: [], error: null };
  const qb = createQueryBuilder(defaultResult);
  const tableQbs: Record<string, ReturnType<typeof createQueryBuilder>> = {};
  const storage = createStorageMock();
  const functions = createFunctionsMock(overrides.invokeResult ?? { data: { success: true }, error: null });
  const channel = createChannelMock();

  const auth: SupabaseMockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' }, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) },
    ...overrides.authOverrides,
  };

  // Build per-table builders if tableResults provided
  if (overrides.tableResults) {
    for (const [table, result] of Object.entries(overrides.tableResults)) {
      tableQbs[table] = createQueryBuilder(result);
    }
  }

  const fromFn = vi.fn((table: string) => tableQbs[table] ?? qb);

  return {
    auth,
    from: fromFn,
    storage,
    functions,
    channel: vi.fn().mockReturnValue(channel),
    removeChannel: vi.fn().mockResolvedValue('ok'),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _qb: qb,
    _tableQbs: tableQbs,
    _channel: channel,
  };
}
