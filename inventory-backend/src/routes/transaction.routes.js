import express from 'express';
import {
  getAllTransactions,
  createTransaction,
  updateTransaction,
  returnProduct,
  deleteTransaction
} from '../controllers/transaction.controller.js';

const router = express.Router();

router.get('/', getAllTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);


router.put('/:id/return', returnProduct);
router.delete('/:id', deleteTransaction);

export default router;
