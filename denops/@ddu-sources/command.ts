import {
  ActionArguments,
  ActionFlags,
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v3.2.7/types.ts";
import { Denops, fn } from "https://deno.land/x/ddu_vim@v3.2.7/deps.ts";

export type ActionData = {
  command: string;
};

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "command";
  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          /* `:command` gives lines like below.
    Name              Args Address Complete    Definition
!   UserCommandFoo    +            command     call foo#...
!|  UserCommandBar    *            command     call bar#...
             */
          const commandLines = (await fn.execute(
            args.denops,
            "command",
          ) as string).split("\n");

          // Header line may decides prefix size
          commandLines.shift(); // skip first empty line
          const header = commandLines.shift();
          if (header === undefined) {
            throw new Error(":command finished without output");
          }
          const firstColumn = /^( +)Name /.exec(header);
          if (!firstColumn) {
            throw new Error(":command gives unsupported format");
          }

          // enqueue commands from the output.
          const start = firstColumn[1].length;
          controller.enqueue(
            commandLines
              .map((line) => /^(\w+)/.exec(line.substring(start)))
              .filter((match): match is NonNullable<typeof match> =>
                match != null
              )
              .map((match) => {
                return {
                  word: match[1],
                  action: { command: match[1] },
                };
              }),
          );
        } catch (e) {
          console.error(e);
        }
        controller.close();
      },
    });
  }

  actions = {
    edit: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await fn.feedkeys(denops, `:${action.command}`, "n");
      return Promise.resolve(ActionFlags.None);
    },
  };

  params(): Params {
    return {};
  }
}
