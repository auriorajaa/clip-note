import path from "path";
import {AppDataSource} from "../config/database.js";
import {Video} from "../entities/video.entity.js";
import {mkdir} from "fs/promises";
import youtubeDlModule, {youtubeDl} from "youtube-dl-exec";
import type {Flags as YoutubeDlFlags} from "youtube-dl-exec";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import {AppError} from "../utils/errors.js";
import {StatusCodes} from "http-status-codes";
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

type YoutubeDlArgs = YoutubeDlFlags & {
    cookiesFromBrowser?: string;
    extractorArgs?: string;
};

const youtubeDlExec =
    (youtubeDlModule as any).default ?? (youtubeDlModule as any).youtubeDl ?? youtubeDl;

export class VideoService {
    private static readonly AUDIO_DIR = path.join(process.cwd(), "temp", "audio");
    private static readonly videoRepository = AppDataSource.getRepository(Video);

    static async getUserVideos(userId: string): Promise<Video[]> {
        return this.videoRepository.find({
            where: {user: {id: userId}},
            relations: {transcription: true, analysis: true},
            order: {createdAt: "DESC"}
        });
    }

    static async getVideoById(id: string, userId: string): Promise<Video | null> {
        const video = await this.videoRepository.findOne({
            where: {id, user: {id: userId}},
            relations: {transcription: true, analysis: true},
        });

        if (!video) {
            throw new AppError(StatusCodes.NOT_FOUND, "Video not found");
        }

        return video;
    }

    static async ensureDirectoryExists() {
        await mkdir(VideoService.AUDIO_DIR, {recursive: true});
    }

    private static getCookiesOptions(): YoutubeDlArgs {
        const cookiesFile = process.env.YT_COOKIES_FILE;
        if (cookiesFile) {
            return {cookies: cookiesFile};
        }

        const cookiesFromBrowser = process.env.YT_COOKIES_FROM_BROWSER;
        if (cookiesFromBrowser) {
            return {cookiesFromBrowser};
        }

        return {};
    }

    private static getExtraArgs(): YoutubeDlArgs {
        const extractorArgs = process.env.YT_EXTRACTOR_ARGS;
        if (extractorArgs) {
            return {extractorArgs};
        }

        return {};
    }

    private static async runYoutubeDl<T>(
        url: string,
        buildArgs: (proxy?: string) => YoutubeDlArgs,
    ): Promise<T> {
        const proxyUrl = process.env.YT_PROXY_URL;
        const proxyFirst = process.env.YT_PROXY_FIRST === "true";

        // Try the direct connection first (avoids triggering YouTube bot detection
        // from datacenter proxies), falling back to the configured proxy only if
        // the direct attempt fails. Set YT_PROXY_FIRST=true to invert the order.
        const attempts: (string | undefined)[] = proxyFirst && proxyUrl
            ? [proxyUrl, undefined]
            : proxyUrl
              ? [undefined, proxyUrl]
              : [undefined];

        let lastError: unknown;

        for (let i = 0; i < attempts.length; i++) {
            const proxy = attempts[i];
            const hasNext = i < attempts.length - 1;

            try {
                const result = await youtubeDlExec(url, buildArgs(proxy));
                return result as T;
            } catch (error) {
                lastError = error;

                if (hasNext) {
                    logger.warn(
                        "youtube-dl attempt failed, retrying via alternate route",
                        {
                            usedProxy: Boolean(proxy),
                            message: error instanceof Error
                                ? error.message
                                : String(error),
                        },
                    );
                } else {
                    logger.error("youtube-dl failed on all attempts", {
                        attempts: attempts.length,
                        message: error instanceof Error
                            ? error.message
                            : String(error),
                    });
                }
            }
        }

        throw lastError;
    }

    private static async fetchVideoInfo(url: string): Promise<VideoInfo> {
        const rawInfo = await this.runYoutubeDl<YoutubeDLOutput>(
            url,
            (proxy) => ({
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
                ffmpegLocation: ffmpeg.path,
                ...(proxy ? {proxy} : {}),
                ...this.getCookiesOptions(),
                ...this.getExtraArgs(),
            }),
        );

        const info = rawInfo as YoutubeDLOutput;

        if (
            !info.title ||
            !info.uploader ||
            typeof info.duration !== "number"
        ) {
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
    }

    static async getVideoInfo(url: string): Promise<VideoInfo> {
        try {
            return await this.fetchVideoInfo(url);
        } catch (error) {
            logger.error("Error getting video info", {
                message: error instanceof Error ? error.message : String(error),
                stderr: (error as any)?.stderr
                    ? String((error as any).stderr)
                    : undefined,
                stdout: (error as any)?.stdout
                    ? String((error as any).stdout)
                    : undefined,
                stack: error instanceof Error ? error.stack : undefined,
            });

            if (error instanceof Error) {
                // Invalid or unreadable cookies file.
                if (
                    /cookies?/i.test(error.message) &&
                    /(unable to read|could not load|does not look like|netscape)/i.test(
                        error.message,
                    )
                ) {
                    throw new AppError(
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Invalid YouTube cookies file configured on the server (YT_COOKIES_FILE).",
                    );
                }

                // YouTube bot detection (e.g. default return "Sign in to confirm you're not a bot")
                if (
                    error.message.includes("Sign in to confirm") ||
                    error.message.includes("not a bot")
                ) {
                    logger.warn("YouTube bot detection on video info fetch", {
                        url,
                        hasCookies: Boolean(
                            process.env.YT_COOKIES_FILE ||
                                process.env.YT_COOKIES_FROM_BROWSER,
                        ),
                        usesProxy: Boolean(process.env.YT_PROXY_URL),
                    });

                    throw new AppError(
                        StatusCodes.TOO_MANY_REQUESTS,
                        "YouTube is blocking this request (bot detection). " +
                            "Configure valid YouTube cookies on the server (YT_COOKIES_FILE) to bypass.",
                    );
                }
                if (error.message.includes("Private video")) {
                    throw new AppError(
                        StatusCodes.FORBIDDEN,
                        "This video is private",
                    );
                }
                // Region-locked content.
                if (
                    error.message.includes("not available in your country") ||
                    error.message.includes("not available in this country") ||
                    /country|geoblock|geo.?block/i.test(error.message)
                ) {
                    throw new AppError(
                        StatusCodes.FORBIDDEN,
                        "Video is not available in your region/country.",
                    );
                }
                if (error.message.includes("not available")) {
                    throw new AppError(StatusCodes.NOT_FOUND, "Video not found");
                }
                throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to get video info",
                );
            }

            throw new AppError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to get video info",
            );
        }
    }

    static async diagnoseUrl(url: string): Promise<{
        ok: boolean;
        data?: VideoInfo;
        message?: string;
        rawMessage?: string;
    }> {
        try {
            const data = await this.fetchVideoInfo(url);
            return {ok: true, data};
        } catch (error) {
            const stderr = (error as any)?.stderr
                ? String((error as any).stderr)
                : "";
            const rawMessage =
                stderr ||
                (error instanceof Error ? error.message : String(error));

            logger.error("YouTube diagnostics check failed", {
                url,
                rawMessage,
                stack: error instanceof Error ? error.stack : undefined,
            });

            return {
                ok: false,
                message: rawMessage.split("\n").shift()?.trim() || rawMessage,
                rawMessage,
            };
        }
    }

    static async downloadAudio(url: string): Promise<string> {
        try {
            await this.ensureDirectoryExists();

            // Extract video id from given url
            const videoId = ytdl.getVideoID(url);
            const audioPath = path.join(this.AUDIO_DIR, `${videoId}.mp3`);

            // Download audio
            await this.runYoutubeDl<unknown>(url, (proxy) => ({
                extractAudio: true,
                audioFormat: "mp3",
                audioQuality: 0, // Best quality
                output: audioPath,
                noWarnings: true,
                preferFreeFormats: true,
                ffmpegLocation: ffmpeg.path,
                ...(proxy ? {proxy} : {}),
                ...this.getCookiesOptions(),
                ...this.getExtraArgs(),
            }));

            const fileStats = await import("fs/promises").then((fs) =>
                fs.stat(audioPath),
            );

            if (fileStats.size === 0) {
                throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to download audio",
                );
            }

            return audioPath;
        } catch (error) {
            logger.error("Error downloading audio", {
                message: error instanceof Error ? error.message : String(error),
                stderr: (error as any)?.stderr
                    ? String((error as any).stderr)
                    : undefined,
                stdout: (error as any)?.stdout
                    ? String((error as any).stdout)
                    : undefined,
            });

            if (error instanceof Error) {
                if (error.message.includes("ffmpeg")) {
                    throw new AppError(
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        "Failed to download audio",
                    );
                }

                throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    "Failed to download audio",
                );
            }

            throw new AppError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Failed to download audio",
            );
        }
    }
}
