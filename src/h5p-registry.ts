import * as axios from "axios";
import { IRegistry } from "./iregistry";
import { ILibraryData, IRegistryData } from "./iregistry-data";

export default class H5PRegistry implements IRegistry {
  public static async create(): Promise<H5PRegistry> {
    const registry = new H5PRegistry();
    await registry.initialize();
    return registry;
  }
  private registryData: IRegistryData;

  private registryUrl = "https://h5p.org/registry.json";

  private constructor() { }

  public async getLibraryInformationForMachineName(machineName: string): Promise<ILibraryData> {
    for (const libraryName in this.registryData.libraries) {
      const data = this.registryData.libraries[libraryName];
      if (data.machineName === machineName) {
        return data;
      }
    }
    return null;
  }

  public async getAllLibraries(): Promise<ILibraryData[]> {
    const libs = [];
    for (const libraryName in this.registryData.libraries) {
      libs.push(this.registryData.libraries[libraryName]);
    }
    return libs;
  }

  private async initialize() {
    this.registryData = (await axios.default.get<IRegistryData>(this.registryUrl)).data;
    for (const devName in this.registryData.libraries) {
      this.registryData.libraries[devName].devName = devName;
    }
  }
}
