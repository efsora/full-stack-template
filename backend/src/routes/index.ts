import { Router } from "express";

import authRoutes from "./auth/routes.js";
import helloRoutes from "./hello/routes.js";
import usersRoutes from "./users/routes.js";

const router = Router();

// Mount all route modules
router.use("/v1/hello", helloRoutes);
router.use("/v1/users", usersRoutes);
router.use("/auth", authRoutes);

export default router;