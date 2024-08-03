import {
  type ActionArguments,
  ActionFlags,
  type Actions,
  BaseKind,
} from "jsr:@shougo/ddu-vim@~5.0.0/types";
import * as fn from "jsr:@denops/std@~7.0.1/function";
import type { ActionData } from "../@ddu-sources/command.ts";

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  params(): Params {
    return {};
  }
  actions: Actions<Params> = {
    edit: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await fn.feedkeys(denops, `:${action.command}`, "n");
      return Promise.resolve(ActionFlags.None);
    },
  };
}
