import { ILibraryData } from "./iregistry-data";

export interface IRegistry {
  getLibraryInformationForMachineName(machineName: string): Promise<ILibraryData>;
  getAllLibraries(): Promise<ILibraryData[]>;
}
