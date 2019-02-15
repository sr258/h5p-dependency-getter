import { CombinedRegistry } from "./combined-registry";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";
import { LocalRegistry } from "./local-registry";

(async () => {
  const h5pRegistry = await H5PRegistry.create();
  const fallbackRegistry = new GithubFallbackRegistry();
  const localRegistry = await LocalRegistry.create("src/registry-data.json");
  const combinedRegistry = new CombinedRegistry(h5pRegistry, localRegistry, fallbackRegistry);

  const libraries = await combinedRegistry.getAllLibraries();
  const libraryNames = libraries.map((l) => l.devName);
  libraryNames.forEach((n) => console.log(n));
})();
