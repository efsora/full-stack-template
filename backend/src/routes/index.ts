import { Router } from "express";

import helloRoutes from "./hello/routes";
import usersRoutes from "./users/routes";
import currenciesRoutes from "./currencies/routes";
import walletsRoutes from "./wallets/routes";
import transactionsRoutes from "./transactions/routes";

const router = Router();

router.use("/v1/hello", helloRoutes);
router.use("/v1/users", usersRoutes);
router.use("/v1/currencies", currenciesRoutes);
router.use("/v1/wallets", walletsRoutes);
router.use("/v1/transactions", transactionsRoutes);

export default router;
