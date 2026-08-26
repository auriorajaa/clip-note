import {protos, SpeechClient} from "@google-cloud/speech";
import {Storage} from "@google-cloud/storage";
import logger from "../utils/logger.js";
import {AppError} from "../utils/errors.js";
import {StatusCodes} from "http-status-codes";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import {unlink} from "fs/promises";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface TranscriptionResult {
    text: string;
    confidence: number;
    isMusic?: boolean;
}

export class TranscriptionService {
    private static readonly BUCKET_NAME = "clip-note-bucket-for-audio";
    private static readonly speechClient = new SpeechClient();
    private static readonly storage = new Storage();

    // Make sure the Google Bucket is existed
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
            logger.error(`Error creating bucket ${this.BUCKET_NAME}`, {error});

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

    static async deleteFromGCS(gcsUrl: string): Promise<void> {
        try {
            const fileName = gcsUrl.split("/").pop();
            if (!fileName) return;

            const file = this.storage.bucket(this.BUCKET_NAME).file(fileName);
            const [exists] = await file.exists();

            if (exists) {
                await file.delete();
                logger.info(`Audio deleted from GCS: ${gcsUrl}`);
            }
        } catch (error) {
            logger.error(`Error deleting audio from GCS: ${gcsUrl}`);
        }
    }

    static async convertToWav(inputPath: string): Promise<string> {
        const outputPath = path.join(
            path.dirname(inputPath),
            `${path.basename(inputPath, path.extname(inputPath))}.wav`,
        );

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat("wav")
                .audioFilters([
                    "aformat=channel_layouts=mono", // ensure mono output
                    "aresample=16000", // high quality resampling
                    // "highpass=f=50", // remove low frequency noise
                    // "lowpass=f=3000", // focus on speech frequencies
                    // "afftdn=nf=-25", // reduce noise
                    // "loudnorm=I=16:LRA=11:TP=-1.5", // normalize audio levels
                ])
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
                .audioFrequency(16000) // standard audio frequency for speech
                .audioFilter(["silencedetect=n=-50dB:d=0.5", "volumedetect"])
                .save(analysisPath)
                .on("stderr", (stderrLine: string) => {
                    logger.info(`FFmpeg stderr: ${stderrLine}`);

                    if (stderrLine.includes("silence_duration")) {
                        musicScore -= 1; // less silence, more music
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

                            if (maxVolume > -5) musicScore + 1; // high volume is at it's peak, suggest it's a music
                        }
                    }
                    totalSamples += 1;
                })
                .on("end", async () => {
                    await unlink(analysisPath).catch(() => {
                    });
                    const ratio = totalSamples > 0 ? musicScore / totalSamples : 0;

                    logger.info(`Music detection ratio: ${ratio}`);
                    resolve(ratio > 0.5 ? "music" : "speech");
                })
                .on("error", async (err: Error) => {
                    logger.error(`Error detecting content type: ${err}`);
                    await unlink(analysisPath).catch(() => {
                    });

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
        let gcsUrl: string | undefined;

        try {
            if (!audioPath) {
                throw new AppError(StatusCodes.BAD_REQUEST, "No audio file provided");
            }

            await this.ensureBucketExists();

            // convert the file to wav if it's not already
            wavePath = await this.convertToWav(audioPath);
            logger.info(`Converted audio to WAV: ${wavePath}`);

            // detect if content is music or not
            const contentType = await this.detectContentType(wavePath);
            logger.info(`Detected content type: ${contentType}`);

            if (contentType === "music") {
                await unlink(wavePath).catch(() => {
                });

                return {
                    text: "[MUSIC CONTENT DETECTED]",
                    confidence: 1.0,
                    isMusic: true,
                };
            }

            // upload file to Google Cloud storage
            gcsUrl = await this.uploadToGCS(wavePath);
            logger.info(`Uploaded audio to GCS: ${gcsUrl}`);

            // configure transcription request using Google Cloud speech
            const request: protos.google.cloud.speech.v1.ILongRunningRecognizeRequest =
                {
                    audio: {uri: gcsUrl},
                    config: {
                        encoding:
                        protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding
                            .LINEAR16,
                        sampleRateHertz: 16000,
                        languageCode: process.env.SPEECH_TO_TEXT_LANGUAGE || "en-US",
                        enableAutomaticPunctuation: true,
                        model: "default",
                        useEnhanced: true,
                        metadata: {
                            interactionType: "DICTATION",
                            microphoneDistance: "NEARFIELD",
                            recordingDeviceType: "SMARTPHONE",
                        },
                        enableWordTimeOffsets: true,
                        enableWordConfidence: true,
                        maxAlternatives: 1,
                        profanityFilter: true,
                        adaptation: {
                            phraseSetReferences: [],
                            customClasses: [],
                        },
                        audioChannelCount: 1,
                        enableSeparateRecognitionPerChannel: false,
                        speechContexts: [
                            {
                                phrases: ["video", "youtube", "subscribe", "like", "comment"],
                                boost: 20,
                            },
                        ],
                    },
                };

            const [operation] = await this.speechClient.longRunningRecognize(request);
            const [response] = await operation.promise();
            logger.info(`Transcription response: ${JSON.stringify(response)}`);

            // clean up files
            await Promise.all([
                wavePath ? unlink(wavePath).catch(() => {
                }) : Promise.resolve(),
                gcsUrl ? this.deleteFromGCS(gcsUrl) : Promise.resolve(),
            ]);

            if (!response.results || response.results.length === 0) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    "No transcription results found",
                );
            }

            const transcription = response.results
                .map((result) => result.alternatives?.[0]?.transcript || "")
                .join(" ");

            const confidence =
                response.results.reduce(
                    (sum, result) => sum + (result.alternatives?.[0]?.confidence || 0),
                    0,
                ) / response.results.length;

            if (!transcription.trim()) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    "No transcription results found",
                );
            }

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
