import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const MONETIZACAO_SRC = path.resolve(__dirname, "../../services/monetizacao/src");

/**
 * Custom plugin to resolve @/ alias based on which workspace the
 * importing file belongs to. Files inside services/monetizacao/
 * get @/ → services/monetizacao/src/, everything else gets @/ → apps/main/src/.
 */
function workspaceAliasPlugin(): Plugin {
  return {
    name: "workspace-alias",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.startsWith("@/") || !importer) return null;

      const relativePart = source.slice(2); // strip "@/"

      // If the importer is inside the monetizacao service, resolve to its src
      if (importer.includes("services/monetizacao/")) {
        return this.resolve(
          path.resolve(MONETIZACAO_SRC, relativePart),
          importer,
          { skipSelf: true }
        );
      }

      // Otherwise resolve to the main app src
      return this.resolve(
        path.resolve(__dirname, "src", relativePart),
        importer,
        { skipSelf: true }
      );
    },
  };
}

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [workspaceAliasPlugin(), react()],
  resolve: {
    alias: {
      // Resolve the @bethel/monetizacao package to its source entry point
      "@bethel/monetizacao": path.resolve(
        __dirname,
        "../../services/monetizacao/src/module.tsx"
      ),
    },
    dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
