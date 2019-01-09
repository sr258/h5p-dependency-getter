import * as fs from "fs-extra";

import { IRegistry } from "./iregistry";
import { ILibraryData, IRegistryData } from "./iregistry-data";

export class LocalRegistry implements IRegistry {
  public static async create(path: string): Promise<LocalRegistry> {
    const registry = new LocalRegistry(path);
    await registry.initialize();
    return registry;
  }
  private registryData: IRegistryData;
  private constructor(private path: string) { }

  public async getLibraryInformationForMachineName(machineName: string): Promise<ILibraryData> {
    for (const libraryName in this.registryData.libraries) {
      const data = this.registryData.libraries[libraryName];
      if (data.machineName === machineName) {
        return data;
      }
    }
    return null;
  }

  private async initialize() {
    this.registryData = (await fs.readJSON(this.path));
    for (const devName in this.registryData.libraries) {
      this.registryData.libraries[devName].devName = devName;
    }
  }
}
