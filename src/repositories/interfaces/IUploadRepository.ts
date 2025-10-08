export interface IUploadRepository {
  generateAuthParameters(): any;
  uploadImage(fileBuffer: Buffer, fileName: string): Promise<any>;
}
