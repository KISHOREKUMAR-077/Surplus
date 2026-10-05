import { Router, Request, Response } from 'express';
import { analyzeFoodVisual } from '../services/aiScreening';

export const screeningRouter = Router();

screeningRouter.post('/analyze-food', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, foodName, stage, inspectorName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const result = await analyzeFoodVisual({
      imageBase64,
      mimeType: mimeType || 'image/jpeg',
      foodName: foodName || 'Food Item',
      stage: stage || 'donor',
      inspectorName: inspectorName || 'Inspector',
    });

    return res.json(result);
  } catch (err) {
    console.error('[API] /analyze-food error:', err);
    return res.status(500).json({ error: 'Failed to analyze food image' });
  }
});
