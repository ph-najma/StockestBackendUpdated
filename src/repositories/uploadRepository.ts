import imagekit from "../config/imagekit";
import { IUploadRepository } from "./interfaces/IUploadRepository";

export class UploadRepository implements IUploadRepository {
  generateAuthParameters() {
    return imagekit.getAuthenticationParameters();
  }

  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<any> {
    return await imagekit.upload({
      file: fileBuffer, // Buffer
      fileName,
    });
  }
}
