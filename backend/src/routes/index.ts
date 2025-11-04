import { Router } from "express";

import aiDemoRoutes from "./ai-demo/routes";
import helloRoutes from "./hello/routes";
import usersRoutes from "./users/routes";

const router = Router();

router.use("/v1/hello", helloRoutes);
router.use("/v1/users", usersRoutes);
router.use("/v1/ai-demo", aiDemoRoutes);

export default router;
