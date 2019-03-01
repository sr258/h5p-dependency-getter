import * as exec from "await-exec";
import * as fs from "fs-extra";

import { CombinedRegistry } from "./combined-registry";
import { Getter } from "./getter";
import { GithubFallbackRegistry } from "./github-fallback-registry";
import H5PRegistry from "./h5p-registry";
import { IRegistry } from "./iregistry";
import { ILibraryData } from "./iregistry-data";
import { LocalRegistry } from "./local-registry";

const commitMessage = "{{ author }} updated {{ language_name }} translation using Weblate @ Deutsche H5P-Übersetzungscommunity.\n\n \
Translate-URL: {{ url }}";
const addMessage = "{{ author }} added {{ language_name }} translation using Weblate @ Deutsche H5P-Übersetzungscommunity.\n\n \
Translate-URL: {{ url }}";
const deleteMessage = "{{ author }} deleted {{ language_name }} translation using Weblate @ Deutsche H5P-Übersetzungscommunity.\n\n \
Translate-URL: {{ url }}";
const mergeMessage = "Merge branch '{{ component_remote_branch }}' into Weblate.";

async function getInternalInfo(devName, directory): Promise<any> {
  try {
    const libInfo = await fs.readJSON(directory + "/library.json");
    return libInfo;
  } catch (e) {
    console.error(`No library.json in ${directory}. Skipping`);
    return null;
  }
}

function createWeblateImportData(lib: ILibraryData, license: string, languageFilename: string, ) {
  return {
    add_message: addMessage,
    branch: "master",
    commit_message: commitMessage,
    delete_message: deleteMessage,
    file_format: "json",
    filemask: "language/*.json",
    license: license || "unknown",
    license_url: Getter.convertGitUrlToHttps(lib.repository),
    merge_message: mergeMessage,
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
        console.log("original:");
        console.log(JSON.stringify(original));
        console.log("roundtrip:");
        console.log(JSON.stringify(roundtrip));
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

// tslint:disable-next-line: no-floating-promises
(async () => {
  const libraryDir = "/home/sebastian/Documents/h5p_dev/h5p-dependency-getter/libs";

  const h5pRegistry = await H5PRegistry.create();
  const fallbackRegistry = new GithubFallbackRegistry();
  const localRegistry = await LocalRegistry.create("src/registry-data.json");
  const combinedRegistry = new CombinedRegistry(h5pRegistry, localRegistry, fallbackRegistry);

  const getter = new Getter(combinedRegistry);

  let libraries = await combinedRegistry.getAllLibraries();
  const weblateInfo = [];
  const checkedLibMachineNames = [];

  const args = process.argv;
  args.splice(0, 2);
  if (args.length > 0) {
    libraries = [];
    for (const arg of args) {
      const lib = await combinedRegistry.getLibraryInformationForMachineName(arg);
      if (lib) {
        libraries.push(lib);
      }
    }
  }

  console.log(JSON.stringify(libraries));

  for (const lib of libraries) {
    try {
      await addLibraryInfoRecursive(lib.machineName, libraryDir, combinedRegistry, getter, weblateInfo, checkedLibMachineNames);
    } catch (e) {
      continue;
    }
  }
  console.log(JSON.stringify(weblateInfo));
})();
