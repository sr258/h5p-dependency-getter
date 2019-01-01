import * as decamelize from "decamelize";
import * as git from "simple-git/promise";
import { IRegistry } from "./iregistry";
import { ILibraryData } from "./iregistry-data";

export class GithubFallbackRegistry implements IRegistry {
  private git: any;

  constructor() {
    this.git = git();
  }

  public async getLibraryInformationForMachineName(machineName: string): Promise<ILibraryData> {
    const dashedMachineName = decamelize(machineName.replace("H5P", "H5p"), "-")
      .replace(".", "-");
    try {
      const repository = `git@github.com:h5p/${dashedMachineName}.git`;

      await this.git.listRemote([repository, "-q"]);
      return {
        dependencies: [],
        devName: dashedMachineName,
        machineName,
        repository,
        version: {
          major: "1",
          minor: "0"
        }
      };
    } catch (e) {
      return null;
    }
  }
}
