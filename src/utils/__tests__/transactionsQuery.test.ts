import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRANSACTIONS_QUERY,
  parseTransactionsQuery,
} from "../transactionsQuery";

describe("parseTransactionsQuery", () => {
  it("uses defaults for empty and invalid values", () => {
    expect(parseTransactionsQuery(new URLSearchParams())).toEqual(
      DEFAULT_TRANSACTIONS_QUERY,
    );
    expect(
      parseTransactionsQuery(
        new URLSearchParams("type=bogus&status=unknown&sort=hash&dir=sideways&page=-2"),
      ),
    ).toEqual(DEFAULT_TRANSACTIONS_QUERY);
  });

  it("parses supported filters, sort options, and page", () => {
    expect(
      parseTransactionsQuery(
        new URLSearchParams("type=release&status=pending&sort=amount&dir=asc&page=3"),
      ),
    ).toEqual({
      type: "release",
      status: "pending",
      sort: "amount",
      dir: "asc",
      page: 3,
    });
  });
});
