import { Router } from "express";

import authRoutes from "./auth/routes";
import helloRoutes from "./hello/routes";
import usersRoutes from "./users/routes";

const router = Router();

// Mount all route modules
router.use("/v1/hello", helloRoutes);
router.use("/v1/users", usersRoutes);
router.use("/auth", authRoutes);

export default router;