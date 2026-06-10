import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import salesRouter from "./sales";
import expensesRouter from "./expenses";
import shiftsRouter from "./shifts";
import adminRouter from "./admin";
import tanksRouter from "./tanks";
import filtersRouter from "./filters";
import debtsRouter from "./debts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(expensesRouter);
router.use(shiftsRouter);
router.use(adminRouter);
router.use(tanksRouter);
router.use(filtersRouter);
router.use(debtsRouter);

export default router;
