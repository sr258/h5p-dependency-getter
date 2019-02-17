import * as exec from "await-exec";
import * as fs from "fs-extra";

import { CombinedRegistry } from "./combined-registry";
import { Getter } from "./getter";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";
import { IRegistry } from "./iregistry";
import { ILibraryData } from "./iregistry-data";
import { LocalRegistry } from "./local-registry";

const commitMessage = "Updated translation '{{ language_name }}' using Weblate @ H5P Translation Community.\n\n\
Translate-URL: {{ url }}\n";

async function getInternalInfo(devName, directory): Promise<any> {
  try {
    const libInfo = await fs.readJSON(directory + "/library.json");
    return libInfo;
  } catch (e) {
    console.error(`No library.json in ${directory}. Skipping`);
    return null;
  }
}

function createWeblateImportData(lib: ILibraryData, license: string, languageFilename: string,) {
  return {
    branch: "master",
    commit_message: commitMessage,
    file_format: "json",
    filemask: "language/*.json",
    license: license || "unknown",
    license_url: Getter.convertGitUrlToHttps(lib.repository),
    name: lib.devName,
    new_base: `language/${languageFilename}.json`,
    push: lib.repository,
    push_on_commit: false,
    repo: lib.repository,
    repoweb: `${Getter.convertGitUrlToHttps(lib.repository)}/%(branch)s/%(file)s#L%(line)s`,
    slug: lib.devName,
    template: `language/${languageFilename}.json`,
    vcs: "github",
  };
}

async function getBaseLanguageFile(libraryDirectory): Promise<string> {
  if (await fs.pathExists(libraryDirectory + "/language/.en.json")) {
    return ".en";
  }
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
      console.log(`No base language file in library ${info.devName}. Not adding this library to the list.`);
    }
    if (languageFilename && libInternalInfo) {
      await exec(`cd /home/sebastian/Documents/translate && python3 -m translate.convert.json2po -t ${libPath}/language/${languageFilename}.json ${libPath}/language/${languageFilename}.json /home/sebastian/tmp/test.po`);
      await exec(`cd /home/sebastian/Documents/translate && python3 -m translate.convert.po2json -t ${libPath}/language/${languageFilename}.json /home/sebastian/tmp/test.po /home/sebastian/tmp/roundtrip.json`);
      const original = await fs.readJSON(`${libPath}/language/${languageFilename}.json`);
      const roundtrip = await fs.readJSON("/home/sebastian/tmp/roundtrip.json");
      if (JSON.stringify(original) !== JSON.stringify(roundtrip)) {
        console.error(`roundtrip not identical @ ${info.devName}. Not adding this library to the list.`);
      } else {
        weblateInfo.push(createWeblateImportData(info, libInternalInfo.license, languageFilename));
      }
    }
  }

  checkedMachineNames.push(machineName);

  const dependencies = await getter.getDependencyInfos(libPath);
  for (const dep of dependencies) {
    await addLibraryInfoRecursive(dep.machineName, libraryBaseDir, registry, getter, weblateInfo, checkedMachineNames);
  }
}

(async () => {
  const libraryDir = "/home/sebastian/Documents/h5p_dev/h5p-dependency-getter/libs";

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
