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

  private crawlSemanticsRecursive(node: any) {
    if (node.type && node.type === "library" && node.options) {
      for (const option of node.options) {
        const match = (option as string).match(/(.*)\s(\d+)\.(\d+)/);
        if (match.length > 0) {
          this.metadata.dynamicDependencies.push({ machineName: match[1], majorVersion: Number.parseInt(match[2]), minorVersion: Number.parseInt(match[3]) });
        }
      }
    }
    if (typeof node === "object") {
      for (const property of Object.values(node)) {
        this.crawlSemanticsRecursive(property);
      }
    }
  }

  private async addDynamicDependencies() {
    try {
      const semantics = (await fs.readJSON(this.libraryPath + "/semantics.json"));
      if (!semantics) {
        return;
      }
      this.metadata.dynamicDependencies = [];
      this.crawlSemanticsRecursive(semantics);
    } catch (e) {
      return;
    }
  }

  private async initialize() {
    this.metadata = (await fs.readJSON(this.libraryPath + "/library.json")) as ILibraryMetadata;
    await this.addDynamicDependencies();
  }
}
