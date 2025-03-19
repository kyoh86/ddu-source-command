import type { Item } from "jsr:@shougo/ddu-vim@~10.2.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.2.0/source";
import * as fn from "jsr:@denops/std@~7.5.0/function";
import type { OnInitArguments } from "jsr:@shougo/ddu-vim@~10.2.0/source";

export type ActionData = {
  command: string;
};

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  override kind = "command";
  commands: Item<ActionData>[] = [];
  override async onInit(_args: OnInitArguments<Params>) {
    try {
      /* `:command` gives lines like below.
    Name              Args Address Complete    Definition
!   UserCommandFoo    +            command     call foo#...
!|  UserCommandBar    *            command     call bar#...
             */
      const commandLines = (await fn.execute(
        _args.denops,
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
      this.commands = commandLines
        .map((line) => /^(\w+)/.exec(line.substring(start)))
        .filter((match): match is NonNullable<typeof match> => match != null)
        .map((match) => {
          return {
            word: match[1],
            action: { command: match[1] },
          };
        });
    } catch (e) {
      console.error(e);
    }
  }
  gather(): ReadableStream<Item<ActionData>[]> {
    const commands = this.commands;
    return new ReadableStream({
      pull(controller) {
        controller.enqueue(commands);
        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
