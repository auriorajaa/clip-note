import Queue from "bull";
import { AppDataSource } from "../config/database.js";
import { Video } from "../entities/video.entity.js";
import { Transcription } from "../entities/transcription.entity.js";
import { Analysis } from "../entities/analysis.entity.js";
import { User } from "../entities/user.entity.js";
import { VideoService } from "./video.service.js";
import { TranscriptionService } from "./transcription.service.js";
import { unlink } from "fs/promises";
import { AIService } from "./ai.service.js";
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import { StatusCodes } from "http-status-codes";

interface TranscriptionJob {
  url: string;
  videoInfo?: any;
  userId: string;
}

export class JobsService {
  private static transcriptionQueue: Queue.Queue;
  private static readonly videoRepository = AppDataSource.getRepository(Video);
  private static readonly transcriptionRepository =
    AppDataSource.getRepository(Transcription);
  private static readonly analysisRepository =
    AppDataSource.getRepository(Analysis);
  private static readonly userRepository = AppDataSource.getRepository(User);

  static getTranscriptionQueue() {
    return this.transcriptionQueue;
  }

  static async initialize() {
    this.transcriptionQueue = new Queue<TranscriptionJob>("transcription", {
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // 24 hours
          count: 100,
        },
        removeOnFail: {
          age: 24 * 3600, // 24 hours
        },
      },
    });

    await this.setupQueueHandlers();
  }

  static async setupQueueHandlers() {
    this.transcriptionQueue.process(async (job) => {
      const { url, userId } = job.data;
      let audioPath: string | undefined;
      let video: Video | null = null;

      try {
        // create new video or update if it's already exists
        video = await this.videoRepository.findOne({ where: { url } });
        if (!video) {
          video = new Video();
          video.url = url;
          video.status = "processing";
          video.user = { id: userId } as User;
        }

        job.progress(10);

        // get the video info if not present
        const videoInfo =
          job.data.videoInfo || (await VideoService.getVideoInfo(url));

        // update the video infromation
        Object.assign(video, {
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          author: videoInfo.author,
          thumbnail: videoInfo.thumbnailUrl || videoInfo.thumbnail,
        });

        await this.videoRepository.save(video);

        job.progress(20);

        // download audio
        audioPath = await VideoService.downloadAudio(url);

        job.progress(40);

        // transcribe audio
        const transcriptionResult =
          await TranscriptionService.transcribe(audioPath);

        // check for existing transcription and update or create one if not exists
        let transcription = await this.transcriptionRepository.findOne({
          where: { video: { id: video.id } },
        });

        if (transcription) {
          // update existing transcription
          transcription.text = transcriptionResult.text;
          transcription.confidence = transcriptionResult.confidence;
          transcription.isMusic = transcriptionResult.isMusic || false;
          transcription.audioPath = audioPath;
        } else {
          // create new transcription
          transcription = new Transcription();
          transcription.video = video;
          transcription.text = transcriptionResult.text;
          transcription.confidence = transcriptionResult.confidence;
          transcription.isMusic = transcriptionResult.isMusic || false;
          transcription.audioPath = audioPath;
        }

        await this.transcriptionRepository.save(transcription);

        // clean up the audio file
        if (audioPath) {
          await unlink(audioPath).catch(() => {});
        }

        job.progress(70);

        // don't proceed with AI analysis if it's a music video
        if (transcriptionResult.isMusic) {
          video.status = "completed";
          await this.videoRepository.save(video);

          return {
            videoInfo,
            transcription: transcriptionResult,
            status: "completed",
          };
        }

        // analyze video
        const analysisResult = await AIService.analyzeTranscription(
          transcriptionResult.text,
          videoInfo,
        );

        // check for existing analysis and update or create new one
        let analysis = await this.analysisRepository.findOne({
          where: { video: { id: video.id } },
        });

        if (analysis) {
          Object.assign(analysis, analysisResult);
        } else {
          analysis = new Analysis();
          Object.assign(analysis, analysisResult);
          analysis.video = video;
        }
        await this.analysisRepository.save(analysis);

        video.status = "completed";
        await this.videoRepository.save(video);

        job.progress(100);

        return {
          videoInfo,
          transcription: transcriptionResult,
          analysis: analysisResult,
          status: "completed",
        };
      } catch (error) {
        // clean up audio file in case of error
        if (audioPath) {
          await unlink(audioPath).catch(() => {});
        }

        // update video status to failed
        if (video) {
          video.status = "failed";
          await this.videoRepository.save(video);
        }

        logger.error("Job processing error:", error);

        if (
          error instanceof AppError &&
          (error.message.includes("No speech detected") ||
            error.message.includes("This video is private") ||
            error.message.includes("This video is no longer available"))
        ) {
          return {
            error: error.message,
            status: "failed",
            final: true,
          };
        }

        throw error;
      }
    });

    this.transcriptionQueue.on("completed", async (job, result) => {
      try {
        const user = await this.userRepository.findOne({
          where: { id: job.data.userId },
        });

        if (user && result.videoInfo) {
          // TODO: send a job completion email
        }
      } catch (error) {
        logger.error("Error sending job completion email:", error);
      }
    });

    this.transcriptionQueue.on("failed", async (job, error) => {
      logger.error(`Job ${job.id} failed: ${error}`);
    });

    this.transcriptionQueue.on("error", (error) => {
      logger.error("Transcription queue error", error);
    });

    // clean up stuck jobs
    this.transcriptionQueue.clean(24 * 3600 * 1000, "delayed");
    this.transcriptionQueue.clean(24 * 3600 * 1000, "wait");
    this.transcriptionQueue.clean(24 * 3600 * 1000, "active");
  }

  static async addTranscriptionJob(url: string, videoInfo?: any, user?: any) {
    let video = await this.videoRepository.findOne({ where: { url } });

    if (!video) {
      video = new Video();
      video.url = url;
      video.status = "pending";
      video.user = user;

      if (videoInfo) {
        Object.assign(video, {
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          author: videoInfo.author,
          thumbnail: videoInfo.thumbnailUrl || videoInfo.thumbnail,
        });
      }

      await this.videoRepository.save(video);
    }

    const job = await this.transcriptionQueue.add({
      url,
      videoInfo,
      userId: user.id,
    });

    return { jobId: job.id };
  }

  static async getJobStatus(jobId: string) {
    const job = await this.transcriptionQueue.getJob(jobId);

    // If there are no job, send message job not found
    if (!job) {
      throw new AppError(StatusCodes.NOT_FOUND, "Job not found");
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;
    const attempts = job.attemptsMade;

    // get video status from database if it's available
    let videoStatus = null;

    if (result?.videoInfo?.url) {
      const video = await this.videoRepository.findOne({
        where: { url: result.videoInfo.url },
        relations: { transcription: true, analysis: true },
      });

      if (video) {
        videoStatus = {
          id: video.id,
          status: video.status,
          hasTranscription: !!video.transcription,
          hasAnalysis: !!video.analysis,
        };
      }
    }

    return {
      id: job.id,
      state,
      progress,
      result,
      failedReason,
      attempts,
      videoStatus,
      thumbnail: result?.videoInfo?.thumbnail || null,
      final: result?.final || state === "completed" || attempts >= 3,
    };
  }

  static async getAllJobs(userId: string) {
    // get jobs in different states
    const activeJobs = await this.transcriptionQueue.getActive();
    const waitingJobs = await this.transcriptionQueue.getWaiting();
    const completedJobs = await this.transcriptionQueue.getCompleted();
    const delayedJobs = await this.transcriptionQueue.getDelayed();
    const failedJobs = await this.transcriptionQueue.getFailed();

    const jobs = [
      ...activeJobs,
      ...waitingJobs,
      ...completedJobs,
      ...delayedJobs,
      ...failedJobs,
    ];

    // filter jobs by user ID and sort by timestamp (recent)
    const userJobs = jobs.filter((job) => job.data.userId === userId);
    userJobs.sort((a, b) => b.timestamp - a.timestamp);

    const jobDetails = await Promise.all(
      userJobs.map(async (job) => {
        const state = await job.getState();

        return {
          id: job.id,
          state,
          progress: job.progress(),
          data: job.data,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          attemptsMade: job.attemptsMade,
          result: job.returnvalue,
          failedReason: job.failedReason,
          thumbnail: job.data?.videoInfo?.thumbnail || null,
          duration: job.data?.videoInfo?.duration || null,
          // get video status if available
          videoStatus: job.data?.url
            ? await this.getVideoStatus(job.data.url)
            : null,
        };
      }),
    );

    return jobDetails;
  }

  // helper method to get video status
  private static async getVideoStatus(url: string) {
    const video = await this.videoRepository.findOne({
      where: { url },
      relations: { transcription: true, analysis: true },
    });

    if (!video) return null;

    return {
      id: video.id,
      status: video.status,
      hasTranscription: !!video.transcription,
      hasAnalysis: !!video.analysis,
      title: video.title,
      thumbnail: video.thumbnail,
    };
  }
}
