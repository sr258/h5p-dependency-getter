import * as fs from "fs-extra";

import { CombinedRegistry } from "./combined-registry";
import { Getter } from "./getter";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";
import { IRegistry } from "./iregistry";
import { ILibraryData } from "./iregistry-data";
import { LocalRegistry } from "./local-registry";

async function getInternalInfo(devName, directory): Promise<any> {
  try {
    const libInfo = await fs.readJSON(directory + "/library.json");
    return libInfo;
  } catch (e) {
    console.error(`No library.json in ${directory}. Skipping`);
    return null;
  }
}

function createWeblateImportData(lib: ILibraryData, license: string, languageFilename: string) {
  return {
    branch: "master",
    file_format: "json",
    filemask: "language/*.json",
    license: license || "unknown",
    license_url: Getter.convertGitUrlToHttps(lib.repository),
    name: lib.devName,
    new_base: `language/${languageFilename}.json`,
    push: lib.repository,
    repo: lib.repository,
    slug: lib.devName,
    template: `language/${languageFilename}.json`,
    vcs: "github",
  };
}

async function getBaseLanguageFile(libraryDirectory): Promise<string> {
  /*if (await fs.pathExists(libraryDirectory + "/language/.en.json")) {
    return ".en";
  }*/
  if (await fs.pathExists(libraryDirectory + "/language/en.json")) {
    return "en";
  }
  return undefined;
}

async function addLibraryInfoRecursive(machineName: string, libraryBaseDir: string, registry: IRegistry, getter: Getter, weblateInfo: any[], checkedMachineNames: string[]) {
  if (checkedMachineNames.includes(machineName)) {
    return;
  }

  const info = await registry.getLibraryInformationForMachineName(machineName);
  const libPath = await getter.getLibrary(machineName, libraryBaseDir);
  if (info) {
    const libInternalInfo = await getInternalInfo(info.devName, libPath);
    const languageFilename = await getBaseLanguageFile(libPath);
    if (!languageFilename) {
      console.log(`No base language file in library ${info.devName}`);
    }
    if (languageFilename && libInternalInfo) {
      weblateInfo.push(createWeblateImportData(info, libInternalInfo.license, languageFilename));
    }
  }

  checkedMachineNames.push(machineName);

  const dependencies = await getter.getDependencyInfos(libPath);
  for (const dep of dependencies) {
    await addLibraryInfoRecursive(dep.machineName, libraryBaseDir, registry, getter, weblateInfo, checkedMachineNames);
  }
}

(async () => {
  const libraryDir = "./libs";

  const h5pRegistry = await H5PRegistry.create();
  const fallbackRegistry = new GithubFallbackRegistry();
  const localRegistry = await LocalRegistry.create("src/registry-data.json");
  const combinedRegistry = new CombinedRegistry(h5pRegistry, localRegistry, fallbackRegistry);

  const getter = new Getter(combinedRegistry);

  const libraries = await combinedRegistry.getAllLibraries();
  const weblateInfo = [];
  const checkedLibMachineNames = [];

  for (const lib of libraries) {
    try {
      await addLibraryInfoRecursive(lib.machineName, libraryDir, combinedRegistry, getter, weblateInfo, checkedLibMachineNames);
    } catch (e) {
      continue;
    }
  }
  console.log(JSON.stringify(weblateInfo));
})();