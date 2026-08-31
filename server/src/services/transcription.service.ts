import { TranscriptionClient } from "@azure/ai-speech-transcription";
import { AzureKeyCredential } from "@azure/core-auth";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { readFile, unlink } from "fs/promises";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isMusic?: boolean;
}

export class TranscriptionService {
  private static readonly client = new TranscriptionClient(
    process.env.AZURE_SPEECH_ENDPOINT!,
    new AzureKeyCredential(process.env.AZURE_SPEECH_KEY!),
  );

  private static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 2000,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn(
          `Transcription attempt ${attempt}/${maxAttempts} failed: ${error}`,
        );

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * attempt),
          );
        }
      }
    }

    throw lastError;
  }

  static async convertToWav(inputPath: string): Promise<string> {
    const outputPath = path.join(
      path.dirname(inputPath),
      `${path.basename(inputPath, path.extname(inputPath))}.wav`,
    );

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat("wav")
        .audioFilters(["aformat=channel_layouts=mono", "aresample=16000"])
        .outputOptions(["-acodec pcm_s16le", "-ar 16000"])
        .save(outputPath)
        .on("start", (commandLine) => {
          logger.info("FFmpeg process started:", commandLine);
        })
        .on("end", () => {
          logger.info(`Audio converted to WAV: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          logger.error(`Error converting audio to WAV: ${err}`);
          reject(
            new AppError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              "Failed to convert audio to WAV",
            ),
          );
        });
    });
  }

  static async detectContentType(
    audioPath: string,
  ): Promise<"speech" | "music"> {
    const analysisPath = path.join(
      path.dirname(audioPath),
      `${path.basename(audioPath, path.extname(audioPath))}_analysis.wav`,
    );

    return new Promise((resolve, reject) => {
      let musicScore = 0;
      let totalSamples = 0;

      ffmpeg(audioPath)
        .toFormat("wav")
        .audioFrequency(16000)
        .audioFilter(["silencedetect=n=-50dB:d=0.5", "volumedetect"])
        .save(analysisPath)
        .on("stderr", (stderrLine: string) => {
          logger.info(`FFmpeg stderr: ${stderrLine}`);

          if (stderrLine.includes("silence_duration")) {
            musicScore -= 1;
          }

          if (stderrLine.includes("max_volume")) {
            const match = stderrLine.match(/max_volume:\s*([-\d.]+)/);

            if (match) {
              const rawValue = match[1];
              if (!rawValue) {
                throw new AppError(
                  StatusCodes.INTERNAL_SERVER_ERROR,
                  "Failed to parse volume from ffmpeg output",
                );
              }
              const maxVolume = parseFloat(rawValue);

              if (maxVolume > -5) musicScore += 1;
            }
          }
          totalSamples += 1;
        })
        .on("end", async () => {
          await unlink(analysisPath).catch(() => {});
          const ratio = totalSamples > 0 ? musicScore / totalSamples : 0;

          logger.info(`Music detection ratio: ${ratio}`);
          resolve(ratio > 0.5 ? "music" : "speech");
        })
        .on("error", async (err: Error) => {
          logger.error(`Error detecting content type: ${err}`);
          await unlink(analysisPath).catch(() => {});

          reject(
            new AppError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              "Failed to detect content type",
            ),
          );
        });
    });
  }

  static async transcribe(audioPath: string): Promise<TranscriptionResult> {
    let wavePath: string | undefined;

    try {
      if (!audioPath) {
        throw new AppError(StatusCodes.BAD_REQUEST, "No audio file provided");
      }

      wavePath = await this.convertToWav(audioPath);
      logger.info(`Converted audio to WAV: ${wavePath}`);

      const contentType = await this.detectContentType(wavePath);
      logger.info(`Detected content type: ${contentType}`);

      if (contentType === "music") {
        await unlink(wavePath).catch(() => {});

        return {
          text: "[MUSIC CONTENT DETECTED]",
          confidence: 1.0,
          isMusic: true,
        };
      }

      const audioBuffer = await readFile(wavePath);

      const result = await this.retryWithBackoff(() =>
        this.client.transcribe(audioBuffer, {
          locales: [process.env.SPEECH_TO_TEXT_LANGUAGE || "en-US"],
        }),
      );

      await unlink(wavePath).catch(() => {});

      const transcription = result.combinedPhrases?.[0]?.text || "";

      if (!transcription.trim()) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "No transcription results found",
        );
      }

      const confidences = result.phrases?.map((p) => p.confidence ?? 0) || [];
      const confidence =
        confidences.length > 0
          ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
          : 0;

      return {
        text: transcription,
        confidence,
        isMusic: false,
      };
    } catch (error) {
      logger.error(`Error transcribing audio: ${error}`);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to transcribe audio",
      );
    }
  }
}
