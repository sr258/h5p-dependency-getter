export default interface ILibraryMetadata {
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
  preloadedDependencies: [
    {
      machineName: string;
      majorVersion: number;
      minorVersion: number;
    }
  ];
  editorDependencies: [{
    machineName: string;
    majorVersion: number;
    minorVersion: number;
  }];
}
