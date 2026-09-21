import { vi } from "vitest";

export interface MockQueryResult<T> {
  data: T | T[] | null;
  error: { message: string } | null;
}

interface MockTable extends PromiseLike<MockQueryResult<unknown>> {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  _setResult: (result: MockQueryResult<unknown>) => void;
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  _tables: Map<string, MockTable>;
}

function createChainableTable(): MockTable {
  let pendingResult: MockQueryResult<unknown> = { data: null, error: null };

  const table = {
    _setResult(result: MockQueryResult<unknown>) {
      pendingResult = result;
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(pendingResult).then(onFulfilled, onRejected);
    },
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    range: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  } as MockTable;

  for (const key of [
    "select",
    "eq",
    "in",
    "is",
    "not",
    "order",
    "limit",
    "range",
    "update",
    "insert",
    "upsert",
    "delete",
  ] as const) {
    table[key].mockReturnValue(table);
  }

  table.single.mockImplementation(() => Promise.resolve(pendingResult));
  table.maybeSingle.mockImplementation(() => Promise.resolve(pendingResult));
  table.order.mockImplementation(() => Promise.resolve(pendingResult));

  return table;
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const tables = new Map<string, MockTable>();

  const from = vi.fn((tableName: string) => {
    if (!tables.has(tableName)) {
      tables.set(tableName, createChainableTable());
    }
    return tables.get(tableName)!;
  });

  return { from, _tables: tables };
}

export function getMockTable(
  client: MockSupabaseClient,
  tableName: string
): MockTable {
  client.from(tableName);
  return client._tables.get(tableName)!;
}

export function resolveTableQuery<T>(
  table: MockTable,
  result: MockQueryResult<T>
): void {
  table._setResult(result);
}
