import { BaseKind } from "https://deno.land/x/ddu_vim@v3.10.3/types.ts";

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  params(): Params {
    return {};
  }
}
