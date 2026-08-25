import { Router } from "express";
import { VideoController } from "../controller/video.controller.js";
import { validateYoutubeUrl } from "../middleware/validateUrl.js";

const router = Router();

router.post("/info", validateYoutubeUrl, VideoController.getVideoInfo);
router.post("/audio", validateYoutubeUrl, VideoController.downloadAudio);

router.post("/transcribe", VideoController.transcribeVideo);

export default router;
