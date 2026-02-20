import express from 'express';
import { uploadInvoice, getInvoices, updateInvoice, deleteInvoice } from '../controllers/invoice.controller.js';

const router = express.Router();

router.post('/', uploadInvoice);
router.get('/', getInvoices);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;