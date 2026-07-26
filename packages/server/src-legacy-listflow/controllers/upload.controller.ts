import { Request, Response } from 'express';
import { imageProcessingService } from '../services/image.service';
import { aiService } from '../services/ai.service';

export const processImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const processedImage = await imageProcessingService.processImage(req.file.path);
    
    const analysis = await aiService.analyzeImage(processedImage.optimizedPath);

    res.json({
      success: true,
      data: {
        originalPath: req.file.path,
        optimizedPath: processedImage.optimizedPath,
        analysis: analysis,
        metadata: processedImage.metadata
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process image' 
    });
  }
};