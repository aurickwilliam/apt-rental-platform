// Ambient Deno types so the TypeScript language server can resolve the `Deno`
// global in edge function files (which have no tsconfig and are served via the
// inferred project). The Zed Deno LSP provides the real types when it runs;
// this stub is a fallback for tsserver/vtsls and keeps `deno check` happy too.

declare namespace Deno {
  function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
  namespace env {
    function get(key: string): string | undefined;
  }
}
