import { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
  weekSummaries,
} from '../controllers/taskController.js';

const router = Router();

router.get('/', asyncHandler(listTasks));
router.post('/', asyncHandler(createTask));
// Declared before '/:id' so "weeks" is not read as a task id.
router.get('/weeks', asyncHandler(weekSummaries));
router.get('/:id', asyncHandler(getTask));
router.patch('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

export default router;
