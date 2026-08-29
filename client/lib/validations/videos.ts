import * as z from "zod";

export const videoSchema = z.object({
    url: z
        .string()
        .url("Please enter a valid URL")
        .refine((url) => url.includes("youtube.com") || url.includes("youtu.be"), "Please enter a valid YouTube URL"),
});

export type VideoFormValues = z.infer<typeof videoSchema>;