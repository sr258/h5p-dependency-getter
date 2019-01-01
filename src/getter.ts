import * as fs from "fs-extra";
import * as git from "simple-git/promise";
import { IDependency } from "./ilibrary-metadata";
import { IRegistry } from "./iregistry";
import LibraryMetadataGetter from "./library-metadata";

export class Getter {
  public forcedHttps = false;

  public constructor(private registry: IRegistry) { }

  public async getDependenciesForExistingLibrary(libraryPath: string, libraryDirectory: string) {
    const libraryMetadata = await LibraryMetadataGetter.create(libraryPath);
    if (libraryMetadata.metadata && libraryMetadata.metadata.preloadedDependencies) {
      await this.getDependenciesRecursive(libraryMetadata.metadata.preloadedDependencies, libraryDirectory);
    }
    if (libraryMetadata.metadata && libraryMetadata.metadata.editorDependencies) {
      await this.getDependenciesRecursive(libraryMetadata.metadata.editorDependencies, libraryDirectory);
    }
  }

  public async getLibraryAndDependencies(machineName: string, libraryDirectory: string) {
    const libraryInfo = await this.registry.getLibraryInformationForMachineName(machineName);
    if (!libraryInfo) {
      throw new Error(`Could not find library metadata for ${machineName}`);
    }

    const newLibraryPath = libraryDirectory + "/" + libraryInfo.devName;
    try {
      if ((await fs.pathExists(newLibraryPath)) === false) {
        let repo = libraryInfo.repository;
        if (this.forcedHttps) {
          repo = this.convertGitUrlToHttps(repo);
        }
        console.log(`Cloning ${libraryInfo.machineName} from ${repo}`);
        await git().clone(repo, newLibraryPath);
        await this.getDependenciesForExistingLibrary(newLibraryPath, libraryDirectory);
      }
    } catch (e) {
      console.error(`Error when cloning ${libraryInfo.machineName}.`);
      console.error(e);
      await fs.remove(newLibraryPath);
    }
  }

  private async getDependenciesRecursive(dependencies: IDependency[], libraryDirectory: string) {
    for (const dep of dependencies) {
      try {
        await this.getLibraryAndDependencies(dep.machineName, libraryDirectory);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private convertGitUrlToHttps(url: string) {
    return url.replace(/git@github.com:(.*?)\/(.*?).git/g, "https://github.com/$1/$2");
  }
}
