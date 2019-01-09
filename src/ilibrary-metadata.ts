export interface IDependency {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

export interface ILibraryMetadata {
  title: string;
  description: string;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  runnable: number;
  author: string;
  license: string;
  machineName: string;
  coreApi: {
    majorVersion: number,
    minorVersion: number
  };
  embedTypes: Array<"iframe" | "div">;
  preloadedJs: [
    {
      path: string;
    }
  ];
  preloadedCss: [
    {
      path: string;
    }
  ];
  preloadedDependencies: IDependency[];
  editorDependencies: IDependency[];
  dynamicDependencies?: IDependency[];
}
