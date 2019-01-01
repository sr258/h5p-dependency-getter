import * as fs from "fs-extra";
import * as git from "simple-git/promise";
import { IDependency } from "./ilibrary-metadata";
import { IRegistry } from "./iregistry";
import LibraryMetadataGetter from "./library-metadata";

export class Getter {
  public constructor(private registry: IRegistry) { }

  public async loadDependencies(dependencies: IDependency[], libraryDirectory: string) {
    for (const dep of dependencies) {
      const libraryInfo = await this.registry.getLibraryInformationForMachineName(dep.machineName);
      if (!libraryInfo) {
        console.error(`Could not find library metadata for ${dep.machineName}`);
        continue;
      }
      const newLibraryPath = libraryDirectory + "/" + libraryInfo.devName;
      try {
        if ((await fs.pathExists(newLibraryPath)) === false) {
          console.log(`Cloning ${libraryInfo.machineName} from ${libraryInfo.repository}`);
          await git().clone(libraryInfo.repository, newLibraryPath);
          await this.get(newLibraryPath, libraryDirectory);
        }
      } catch (e) {
        console.error(`Error when cloning ${libraryInfo.machineName}.`);
        console.error(e);
        await fs.remove(newLibraryPath);
      }
    }
  }

  public async get(libraryPath: string, lilbraryDirectory: string) {
    const libraryMetadata = await LibraryMetadataGetter.create(libraryPath);
    if (libraryMetadata.metadata && libraryMetadata.metadata.preloadedDependencies) {
      await this.loadDependencies(libraryMetadata.metadata.preloadedDependencies, lilbraryDirectory);
    }
    if (libraryMetadata.metadata && libraryMetadata.metadata.editorDependencies) {
      await this.loadDependencies(libraryMetadata.metadata.editorDependencies, lilbraryDirectory);
    }
  }

  private convertGitUrlToHttps(url: string) {
    return url.replace(/git@github.com:(.*?)\/(.*?).git/g, "https://github.com/$1/$2");
  }
}
