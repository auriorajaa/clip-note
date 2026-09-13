import {Router} from "express";
import {VideoController} from "../controller/video.controller.js";
import {validateYoutubeUrl} from "../middleware/validateUrl.js";

const router = Router();

router.get("/", VideoController.getUserVideos);
router.get("/:id", VideoController.getVideoById);
router.get("/transcribe/:jobId/status", VideoController.getTranscriptionStatus);

router.post("/info", validateYoutubeUrl, VideoController.getVideoInfo);
router.post("/diagnose", validateYoutubeUrl, VideoController.diagnoseVideo);
router.post("/audio", validateYoutubeUrl, VideoController.downloadAudio);
router.post("/transcribe", VideoController.transcribeVideo);
router.post("/jobs/running", VideoController.getAllJobs);

export default router;
