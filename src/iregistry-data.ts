export interface ILibraryData {
  version: {
    major: string;
    minor: string;
  };
  devName?: string;
  machineName: string;
  repository: string;
  dependencies: string[];
}

export interface IRegistryData {
  apiVersion: number;
  libraries: {
    [key: string]: ILibraryData;
  };
}
