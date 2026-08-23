import { SpeechClient } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import path from "path";

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isMusic?: boolean;
}

export class TranscriptionService {
  private static readonly BUCKET_NAME = "clip-note-bucket-for-audio";
  private static readonly speechClient = new SpeechClient();
  private static readonly storage = new Storage();

  // Make sure the Google Bucket is exist
  // If it's not, this method will create it automatically
  static async ensureBucketExists() {
    try {
      const [exists] = await this.storage.bucket(this.BUCKET_NAME).exists();

      // Create one with BUCKET_NAME if it's not exist
      if (!exists) {
        await this.storage.createBucket(this.BUCKET_NAME, {
          location: "asia-southeast2",
          storageClass: "STANDARD",
        });

        logger.info(`Bucket ${this.BUCKET_NAME} successfully created`);
      }
    } catch (error) {
      logger.error(`Error creating bucket ${this.BUCKET_NAME}`, { error });

      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to create bucket",
      );
    }
  }

  static async uploadToGCS(filePath: string): Promise<string> {
    const fileName = path.basename(filePath);
    const bucket = this.storage.bucket(this.BUCKET_NAME);

    try {
      await bucket.upload(filePath, {
        destination: fileName,
        metadata: {
          contentType: "audio/wav",
        },
      });

      const gcsUrl = `gs://${this.BUCKET_NAME}/${fileName}`;
      logger.info(`Audio uploaded to GCS: ${gcsUrl}`);

      return gcsUrl;
    } catch (error) {
      logger.error(`Error uploading audio to GCS: ${error}`);

      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to upload audio to GCS",
      );
    }
  }
}
