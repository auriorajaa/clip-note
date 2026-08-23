import path from "path";
import { AppDataSource } from "../config/database.js";
import { Video } from "../entities/video.entity.js";
import { mkdir } from "fs/promises";
import youtubeDlModule from "youtube-dl-exec";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import ytdl from "ytdl-core";
import logger from "../utils/logger.js";

export interface VideoInfo {
  title: string;
  description: string;
  duration: number;
  author: string;
  videoUrl: string;
  thumbnail: string;
  audioPath?: string;
}

type YoutubeDLOutput = {
  title: string;
  description?: string;
  duration: number;
  uploader: string;
  thumbnail: string;
} & Record<string, unknown>;

export class VideoService {
  private static readonly AUDIO_DIR = path.join(process.cwd(), "temp", "audio");
  private static readonly videoRepository = AppDataSource.getRepository(Video);

  static async ensureDirectoryExists() {
    await mkdir(VideoService.AUDIO_DIR, { recursive: true });
  }

  static async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      // Get video from youtube using youtube-dl (from: youtube-dl-exec package)
      const youtubeDl = (youtubeDlModule as any).default ?? youtubeDlModule;
      const rawInfo = await youtubeDl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
        ffmpegLocation: ffmpeg.path,
      });

      const info = rawInfo as YoutubeDLOutput;

      if (!info.title || !info.uploader || typeof info.duration !== "number") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid video info");
      }

      // Getting a thumbnail with ytdl-core
      const thumbnail =
        info.thumbnail ||
        (info as any).thumbnails?.[0]?.url ||
        `https://i.ytimg.com/vi/${ytdl.getVideoID(url)}/maxresdefault.jpg`;

      return {
        title: info.title,
        description: info.description || "",
        duration: info.duration,
        author: info.uploader,
        videoUrl: url,
        thumbnail: thumbnail,
      };
    } catch (error) {
      logger.error("Error getting video info", { error });

      if (error instanceof Error) {
        // If video is private
        if (error.message.includes("Private video")) {
          throw new AppError(StatusCodes.FORBIDDEN, "This video is private");
        }

        // If video is unavailable
        if (error.message.includes("not available")) {
          throw new AppError(StatusCodes.NOT_FOUND, "Video not found");
        }

        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Something went wrong when getting the video info. Please try again.",
        );
      }

      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Something went wrong when getting the video info. Please try again.",
      );
    }
  }
}
