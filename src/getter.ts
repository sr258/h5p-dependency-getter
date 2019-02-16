import * as fs from "fs-extra";
import * as git from "simple-git/promise";
import { IDependency } from "./ilibrary-metadata";
import { IRegistry } from "./iregistry";
import LibraryMetadataGetter from "./library-metadata";

export class Getter {

  public static convertGitUrlToHttps(url: string) {
    return url.replace(/git@github.com:(.*?)\/(.*?).git/g, "https://github.com/$1/$2");
  }
  public forcedHttps = false;

  public constructor(private registry: IRegistry) { }

  public async getDependencyInfos(libraryPath: string): Promise<IDependency[]> {
    const libraryMetadata = await LibraryMetadataGetter.create(libraryPath);
    let dependencies = [];
    if (libraryMetadata.metadata && libraryMetadata.metadata.preloadedDependencies) {
      dependencies = dependencies.concat(libraryMetadata.metadata.preloadedDependencies);
    }
    if (libraryMetadata.metadata && libraryMetadata.metadata.editorDependencies) {
      dependencies = dependencies.concat(libraryMetadata.metadata.editorDependencies);
    }
    if (libraryMetadata.metadata && libraryMetadata.metadata.dynamicDependencies) {
      dependencies = dependencies.concat(libraryMetadata.metadata.dynamicDependencies);
    }
    return dependencies;
  }

  public async getDependenciesForExistingLibrary(libraryPath: string, libraryDirectory: string) {
    const dependencies = await this.getDependencyInfos(libraryPath);
    await this.getDependenciesRecursive(dependencies, libraryDirectory);
  }

  public async getLibrary(machineName: string, libraryDirectory: string, getDependencies: boolean = false): Promise<string> {
    const libraryInfo = await this.registry.getLibraryInformationForMachineName(machineName);
    if (!libraryInfo) {
      throw new Error(`Could not find library metadata for ${machineName}`);
    }

    const newLibraryPath = libraryDirectory + "/" + libraryInfo.devName;
    try {
      if ((await fs.pathExists(newLibraryPath)) === false) {
        let repo = libraryInfo.repository;
        if (this.forcedHttps) {
          repo = Getter.convertGitUrlToHttps(repo);
        }
        console.log(`Cloning ${libraryInfo.machineName} from ${repo}`);
        await git().clone(repo, newLibraryPath);
        if (getDependencies) {
          await this.getDependenciesForExistingLibrary(newLibraryPath, libraryDirectory);
        }
      }
      return newLibraryPath;
    } catch (e) {
      console.error(`Error when cloning ${libraryInfo.machineName}.`);
      console.error(e);
      await fs.remove(newLibraryPath);
      throw e;
    }
  }

  public async getLibraryAndDependencies(machineName: string, libraryDirectory: string) {
    try {
      await this.getLibrary(machineName, libraryDirectory, true);
    } catch (e) {
      return;
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
}
