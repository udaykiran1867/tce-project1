import express from 'express';
import { downloadPDF, getMonthlySummary, getMonthlyProductReport, getRecentLogs } from '../controllers/logs.controller.js';

const router = express.Router();


router.get('/pdf', downloadPDF);
router.get('/monthly', getMonthlySummary);
router.get('/monthly-products', getMonthlyProductReport);
router.get('/recent', getRecentLogs);

export default router;
