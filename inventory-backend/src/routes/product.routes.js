// import express from 'express';
// import {
//   addProduct,
//   getProducts,
//   updateMaster,
//   markDefective,
//   deleteProduct
// } from '../controllers/product.controller.js';

// const router = express.Router();


// router.get('/', getProducts);


// router.post('/', addProduct);


// router.put('/:id/master', updateMaster);

// router.put('/:id/defective', markDefective);

// // Delete product
// router.delete('/:id', deleteProduct);

// export default router;


import express from 'express';
import {
  addProduct,
  getProducts,
  updateMaster,
  markDefective,
  deleteProduct
} from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getProducts);

router.post('/', addProduct);

router.put('/:id/master', updateMaster);

router.put('/:id/defective', markDefective);

router.delete('/:id', deleteProduct);

export default router;