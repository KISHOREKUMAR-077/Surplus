import { Router, Request, Response } from 'express';
import { simulateSurplusRedistribution } from '../services/simulatorEngine';

export const simulatorRouter = Router();

// POST simulate surplus redistribution
simulatorRouter.post('/simulator/simulate', (req: Request, res: Response) => {
  const { mealCount = 45 } = req.body;
  const result = simulateSurplusRedistribution(Number(mealCount));
  return res.json(result);
});
