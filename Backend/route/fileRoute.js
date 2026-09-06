import express from 'express';
import { getFile } from '../controller/fileController.js';
import { verifyUser } from '../helper/userAuth.js';
const router = express.Router();
router.use(verifyUser);
router.get('/:id', getFile);
export default router;
