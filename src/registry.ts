import * as axios from "axios";
import { ILibraryData, IRegistryData } from "./iregistry-data";

export default class Registry {
  public static async create(): Promise<Registry> {
    const registry = new Registry();
    await registry.initialize();
    return registry;
  }
  private registryUrl = "https://h5p.org/registry.json";
  private registryData: IRegistryData;

  private constructor() {

  }

  public getLibraryInformationForMachineName(machineName: string): ILibraryData {
    for (const libraryName in this.registryData.libraries) {
      const data = this.registryData.libraries[libraryName];
      if (data.machineName === machineName) {
        return data;
      }
    }
    return null;
  }

  private async initialize() {
    this.registryData = (await axios.default.get<IRegistryData>(this.registryUrl)).data;
    for (const devName in this.registryData.libraries) {
      this.registryData.libraries[devName].devName = devName;
    }
  }
}
