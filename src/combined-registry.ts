import { IRegistry } from "./iregistry";
import { ILibraryData } from "./iregistry-data";

export class CombinedRegistry implements IRegistry {
  private registries: IRegistry[];

  constructor(...registries: IRegistry[]) {
    this.registries = registries;
  }

  public async getLibraryInformationForMachineName(machineName: string): Promise<ILibraryData> {
    for (const registry of this.registries) {
      const libraryInformation = await registry.getLibraryInformationForMachineName(machineName);
      if (libraryInformation) {
        return libraryInformation;
      }
    }
    return null;
  }
}
