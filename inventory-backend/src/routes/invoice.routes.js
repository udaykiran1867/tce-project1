import express from 'express';
import { uploadInvoice, getInvoices, deleteInvoice } from '../controllers/invoice.controller.js';

const router = express.Router();

router.post('/', uploadInvoice);
router.get('/', getInvoices);
router.delete('/:id', deleteInvoice);

export default router;