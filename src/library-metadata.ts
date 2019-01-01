import * as fs from "fs-extra";
import { ILibraryMetadata } from "./ilibrary-metadata";

export default class LibraryMetadataGetter {
  public static async create(libraryPath: string): Promise<LibraryMetadataGetter> {
    const lm = new LibraryMetadataGetter(libraryPath);
    await lm.initialize();
    return lm;
  }

  public metadata: ILibraryMetadata;
  private constructor(private libraryPath: string) { }

  private async initialize() {
    this.metadata = (await fs.readJSON(this.libraryPath + "/library.json")) as ILibraryMetadata;
  }
}
