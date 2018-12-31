import LibraryMetadataGetter from "./library-metadata";
import Registry from "./registry";

(async () => {
  const registry = await Registry.create();
  console.log(JSON.stringify(registry.getLibraryInformationForMachineName("H5P.DragNBar")));

  const libraryMetadata = await LibraryMetadataGetter.create("../h5p-interactive-text");
  console.log(JSON.stringify(libraryMetadata.metadata.preloadedDependencies));
})();
