import { Router } from "express";
import healthRouters from "./health.routes.js";

const router = Router();

router.use("/health", healthRouters);

export default router;
