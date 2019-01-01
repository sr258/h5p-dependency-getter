import * as yargs from "yargs";
import { CombinedRegistry } from "./combined-registry";
import { Getter } from "./getter";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";

(async () => {
  const argv = yargs
    .option("https", {
      default: false,
      describe: "use https to access GitHub (resolves authentication issues; enter any/fake credentials when asked for any!)",
      type: "boolean"
    })
    .option("directory", {
      alias: "d",
      demand: true,
      describe: "the directory in which the libraries will be stored",
      type: "string"
    })
    .option("libpath", {
      alias: "p",
      describe: "the path of the directory with the library of which the dependencies should be retrieved",
      type: "string"
    })
    .option("libname", {
      alias: "n",
      describe: "the name of library to get",
      type: "string"
    })
    .argv;

  const h5pRegistry = await H5PRegistry.create();
  const fallbackRegistry = new GithubFallbackRegistry();
  const getter = new Getter(new CombinedRegistry(h5pRegistry, fallbackRegistry));
  getter.forcedHttps = argv.https;
  if (argv.libpath) {
    await getter.getDependenciesForExistingLibrary(argv.libpath, argv.directory);
  }
  if (argv.libname) {
    await getter.getLibraryAndDependencies(argv.libname, argv.directory);
  }
})();
