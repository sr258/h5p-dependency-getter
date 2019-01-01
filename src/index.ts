import { CombinedRegistry } from "./combined-registry";
import { Getter } from "./getter";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";

(async () => {
  const h5pRegistry = await H5PRegistry.create();
  const fallbackRegistry = new GithubFallbackRegistry();
  const getter = new Getter(new CombinedRegistry(h5pRegistry, fallbackRegistry));
  await getter.get("../h5p-course-presentation", "./libs");
})();
