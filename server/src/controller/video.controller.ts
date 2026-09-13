import type { NextFunction, Request, Response } from "express";
import { VideoService } from "../services/video.service.js";
import { successResponse } from "../utils/response.js";
import { AuthService } from "../services/auth.service.js";
import { JobsService } from "../services/jobs.service.js";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/errors.js";
import { SubscriptionService } from "../services/subscription.service.js";

export class VideoController {
  static async getVideoInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      const videoInfo = await VideoService.getVideoInfo(url);

      res.json(successResponse(videoInfo));
    } catch (error) {
      next(error);
    }
  }

  static async diagnoseVideo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { url } = req.body;
      const result = await VideoService.diagnoseUrl(url);

      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  static async downloadAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      const videoInfo = await VideoService.getVideoInfo(url);
      const audioPath = await VideoService.downloadAudio(url);

      res.json(
        successResponse({
          ...videoInfo,
          audioPath,
          message: "Audio downloaded successfully",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async transcribeVideo(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { url } = req.body;
      const userId = req.user?.userId;

      const user = await AuthService.getUserById(userId!);
      const videoInfo = await VideoService.getVideoInfo(url);

      // Check subscription limits before processing the video
      const durationInSeconds = videoInfo.duration;
      await SubscriptionService.checkSubscriptionLimits(
        userId!,
        durationInSeconds,
      );

      // Background job service implementation to transcibe the video
      const { jobId } = await JobsService.addTranscriptionJob(
        url,
        videoInfo,
        user,
      );

      // Increment the user's subscription usage
      await SubscriptionService.incrementUsage(userId!, durationInSeconds);

      res.json(
        successResponse({
          jobId,
          videoInfo,
          message: "Transcription job created successfully",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTranscriptionStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { jobId } = req.params;
      if (!jobId || typeof jobId !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Job ID is required");
      }

      const status = await JobsService.getJobStatus(jobId);
      res.json(successResponse(status));
    } catch (error) {
      next(error);
    }
  }

  static async getUserVideos(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const videos = await VideoService.getUserVideos(userId!);

      // transform the response to include the necessary fields
      const transformedVideo = videos.map((video) => ({
        id: video.id,
        url: video.url,
        title: video.title,
        description: video.description,
        duration: video.duration,
        author: video.author,
        thumbnail: video.thumbnail,
        status: video.status,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        transcription: video.transcription
          ? {
              text: video.transcription.text,
              confidence: video.transcription.confidence,
              isMusic: video.transcription.isMusic,
              createdAt: video.transcription.createdAt,
            }
          : null,
        analysis: video.analysis
          ? {
              summary: video.analysis.summary,
              keyPoints: video.analysis.keyPoints,
              sentiment: video.analysis.sentiment,
              topics: video.analysis.topics,
              suggestedTags: video.analysis.suggestedTags,
              createdAt: video.analysis.createdAt,
            }
          : null,
      }));

      res.json(successResponse(transformedVideo));
    } catch (error) {
      next(error);
    }
  }

  static async getVideoById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id || typeof id !== "string") {
        throw new AppError(StatusCodes.BAD_REQUEST, "Id is required");
      }

      const video = await VideoService.getVideoById(id, userId!);

      if (!video) {
        throw new AppError(StatusCodes.NOT_FOUND, "Video not found");
      }

      // transform the response to include the necessary fields
      const transformedVideo = {
        id: video.id,
        url: video.url,
        title: video.title,
        description: video.description,
        duration: video.duration,
        author: video.author,
        thumbnail: video.thumbnail,
        status: video.status,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        transcription: video.transcription
          ? {
              text: video.transcription.text,
              confidence: video.transcription.confidence,
              isMusic: video.transcription.isMusic,
              createdAt: video.transcription.createdAt,
            }
          : null,
        analysis: video.analysis
          ? {
              summary: video.analysis.summary,
              keyPoints: video.analysis.keyPoints,
              sentiment: video.analysis.sentiment,
              topics: video.analysis.topics,
              suggestedTags: video.analysis.suggestedTags,
              createdAt: video.analysis.createdAt,
            }
          : null,
      };

      res.json(successResponse(transformedVideo));
    } catch (error) {
      next(error);
    }
  }

  static async getAllJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const jobs = await JobsService.getAllJobs(userId!);

      res.json(successResponse(jobs));
    } catch (error) {
      next(error);
    }
  }
}
