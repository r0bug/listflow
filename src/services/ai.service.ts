import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

interface ImageAnalysis {
  itemType: string;
  brand: string;
  condition: string;
  features: string[];
  category: string;
  estimatedValue: string;
  rawAnalysis: string;
  model?: string;
  specifics?: Record<string, string>;
  upc?: string;
  isbn?: string;
}

interface ListingOptions {
  imageAnalysis: ImageAnalysis;
  category?: string;
  condition?: string;
}

// Claude Sonnet 4 pricing (per million tokens)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

function calcCost(usage: { input_tokens?: number; output_tokens?: number }): number {
  const input = (usage.input_tokens || 0) / 1_000_000 * INPUT_COST_PER_M;
  const output = (usage.output_tokens || 0) / 1_000_000 * OUTPUT_COST_PER_M;
  return Math.round((input + output) * 1_000_000) / 1_000_000; // 6 decimal places
}

// Max photos per Claude call — keeps request size manageable
const BATCH_SIZE = 5;

class AIService {
  private anthropicKey: string | null = null;

  constructor() {
    this.anthropicKey = process.env.ANTHROPIC_API_KEY || null;
  }

  private getMediaType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    return 'image/jpeg';
  }

  private async loadImage(imagePath: string): Promise<{ base64: string; mediaType: string } | null> {
    try {
      const resolvedPath = path.isAbsolute(imagePath) ? imagePath : path.resolve(imagePath);
      const rawBuffer = fs.readFileSync(resolvedPath);

      // Resize large images to max 1500px on longest side for Claude analysis
      // This keeps quality high enough for brand/model identification while
      // keeping request sizes manageable (~200-400KB per image instead of 5-7MB)
      let imageBuffer: Buffer;
      try {
        imageBuffer = await sharp(rawBuffer)
          .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch {
        // If sharp fails (corrupt JPEG), send the original
        imageBuffer = rawBuffer;
      }

      return {
        base64: imageBuffer.toString('base64'),
        mediaType: 'image/jpeg'
      };
    } catch (err) {
      console.error(`Failed to read image: ${imagePath}`, err);
      return null;
    }
  }

  /**
   * Analyze one or more images, batching if needed.
   * If there are more photos than BATCH_SIZE, processes in batches
   * and carries forward all prior analysis as context so each batch
   * builds on what was already learned.
   */
  async analyzeImages(imagePaths: string[]): Promise<{ analysis: ImageAnalysis; cost: number }> {
    if (!this.anthropicKey) {
      console.warn('No ANTHROPIC_API_KEY configured, returning mock analysis');
      return { analysis: this.mockAnalyzeImage(), cost: 0 };
    }

    // Load and resize all images
    const loaded = await Promise.all(imagePaths.map(p => this.loadImage(p)));
    const images = loaded.filter((img): img is { base64: string; mediaType: string } => img !== null);

    if (images.length === 0) {
      console.error('No images could be loaded');
      return { analysis: this.mockAnalyzeImage(), cost: 0 };
    }

    // Split into batches
    const batches: { base64: string; mediaType: string }[][] = [];
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      batches.push(images.slice(i, i + BATCH_SIZE));
    }

    const totalSize = images.reduce((sum, img) => sum + img.base64.length, 0);
    console.log(`Analyzing ${images.length} photo(s) in ${batches.length} batch(es) (${(totalSize / 1024 / 1024).toFixed(1)}MB base64 total)...`);

    let priorAnalysis = '';
    let result: ImageAnalysis = this.mockAnalyzeImage();
    let totalCost = 0;

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const isFirst = batchIdx === 0;
      const isLast = batchIdx === batches.length - 1;
      const batchNum = batchIdx + 1;
      const totalBatches = batches.length;

      console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length} photo(s)...`);

      try {
        const batchResult = await this.analyzeBatch(batch, priorAnalysis, isFirst, isLast, batchNum, totalBatches, images.length);
        result = batchResult.analysis;
        totalCost += batchResult.cost;
        // Carry forward the full analysis text for the next batch
        priorAnalysis = result.rawAnalysis;
      } catch (error) {
        console.error(`Batch ${batchNum} failed:`, axios.isAxiosError(error) ? JSON.stringify(error.response?.data) : error);
        // If first batch fails, return mock. Otherwise return what we have so far.
        if (isFirst) return { analysis: this.mockAnalyzeImage(), cost: totalCost };
        break;
      }
    }

    console.log(`  Analysis complete. Total cost: $${totalCost.toFixed(6)}`);
    return { analysis: result, cost: totalCost };
  }

  private async analyzeBatch(
    images: { base64: string; mediaType: string }[],
    priorAnalysis: string,
    isFirst: boolean,
    isLast: boolean,
    batchNum: number,
    totalBatches: number,
    totalPhotos: number
  ): Promise<{ analysis: ImageAnalysis; cost: number }> {
    let prompt: string;

    const responseFormat = `
Respond in this exact format:

Confidence: [0-100]% — how confident you are in a complete, accurate identification
Item: [specific item name with model/version if identifiable]
Brand: [brand name or "Unbranded"]
Model: [model number/name if visible, or "Unknown"]
Condition: [New/Used - Like New/Used - Good/Used - Fair/For Parts]
Features: [feature1, feature2, feature3, feature4, feature5]
Category: [specific eBay category suggestion]
Value: [$XX-$YY estimated market range]
Defects: [list any visible wear, damage, missing parts, or "None visible"]
Keywords: [keyword1, keyword2, keyword3, keyword4, keyword5]
UPC: [12 or 13 digit barcode number if visible on packaging/label/sticker, or "None"]
ISBN: [10 or 13 digit ISBN if visible on a book/media item, or "None"]
Notes: [any additional details that would help a seller write an accurate listing — measurements, materials, era/vintage, compatibility, included accessories]

IMPORTANT: Look carefully at ALL photos for barcodes, UPC codes, ISBN numbers, or EAN codes printed on packaging, labels, stickers, or book covers. These are critical for eBay listings. If you can read any digits from a barcode, report them. UPC barcodes are 12 digits, EAN barcodes are 13 digits, ISBN-10 is 10 digits, ISBN-13 is 13 digits (starts with 978 or 979).

Your goal is to reach 100% confidence in a COMPLETE and ACCURATE identification. Every detail matters — exact brand, model number, variant, generation, color, size, material, included accessories, and condition. A vague identification like "vintage phone" is low confidence; "Western Electric Model 302 Rotary Telephone, Black Bakelite, 1940s, F1 handset" is high confidence. Be thorough and specific.`;

    if (totalBatches === 1) {
      // Single batch — all photos at once
      const photoWord = images.length === 1 ? 'photo' : `${images.length} photos`;
      prompt = `You are examining ${photoWord} of a single item that will be listed on eBay. Each photo shows the item from a different angle or highlights different details (labels, serial numbers, damage, accessories, etc.).

Study ALL the photos together to build a complete, definitive identification. Cross-reference details across photos — a brand name visible in one photo combined with a model number in another gives you the full identification. Leave no detail unexamined.
${responseFormat}`;
    } else if (isFirst) {
      prompt = `You are examining batch 1 of ${totalBatches} batches of photos (${totalPhotos} total) of a SINGLE item for eBay listing. These are the first ${images.length} photos.

Analyze these photos carefully and extract every identifiable detail — brand, model, markings, labels, serial numbers, condition, materials, color, size. More photos are coming that will help you build toward a 100% confident identification. Start strong — capture everything these photos reveal.
${responseFormat}`;
    } else {
      prompt = `You are continuing to examine photos of the SAME item. This is batch ${batchNum} of ${totalBatches} (${totalPhotos} photos total).

Here is your analysis so far from the previous batch(es):
---
${priorAnalysis}
---

Now examine these ${images.length} additional photos. Your job is to INCREASE your identification confidence toward 100%. Look for details you missed or couldn't see before — model numbers, labels on the back/bottom, brand markings, serial numbers, condition details, accessories, size indicators. UPDATE and REFINE every field with any new information. If a previous field said "Unknown", see if these photos answer it. If you identified the brand before, see if these photos reveal the exact model. Every batch should get you closer to a definitive, fully accurate identification.
${responseFormat}`;
    }

    // Build content array: all images first, then the prompt
    const content: any[] = [];
    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType,
          data: img.base64
        }
      });
    }
    content.push({ type: 'text', text: prompt });

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content }]
    }, {
      headers: {
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 120000,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024
    });

    const analysisText = response.data.content?.[0]?.text || '';
    const usage = response.data.usage || {};
    const cost = calcCost(usage);
    console.log(`  Batch ${batchNum} result (${usage.input_tokens || 0}in/${usage.output_tokens || 0}out tokens, $${cost.toFixed(6)}):`, analysisText.substring(0, 200));
    return { analysis: this.parseAnalysis(analysisText), cost };
  }

  // Keep single-image method for backwards compatibility
  async analyzeImage(imagePath: string): Promise<{ analysis: ImageAnalysis; cost: number }> {
    return this.analyzeImages([imagePath]);
  }

  async generateListing(options: ListingOptions): Promise<{ listing: ReturnType<AIService['parseListing']>; cost: number }> {
    if (!this.anthropicKey) {
      return { listing: this.mockGenerateListing(options), cost: 0 };
    }

    try {
      const prompt = `You are an expert eBay seller. Create a listing based on this analysis:

Item Analysis: ${JSON.stringify(options.imageAnalysis)}
Category: ${options.category || 'Auto-detect'}
Condition: ${options.condition || options.imageAnalysis.condition}

Respond in this exact format:

Title: [max 80 chars, SEO optimized with key search terms]
Description: [detailed HTML description with specs, features, condition]
Tags: [comma separated keywords]
Starting Price: $[competitive price]
Buy Now Price: $[reasonable price]
Shipping Cost: $[estimated shipping]`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: 'You are an expert eBay seller. Create compelling, honest, and SEO-optimized listings. Always respond in the exact format requested.',
        messages: [
          { role: 'user', content: prompt }
        ]
      }, {
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const listingText = response.data.content?.[0]?.text || '';
      const usage = response.data.usage || {};
      const cost = calcCost(usage);
      console.log('Claude listing result:', listingText.substring(0, 200));
      return { listing: this.parseListing(listingText), cost };
    } catch (error) {
      console.error('Error generating listing with Claude:', axios.isAxiosError(error) ? error.response?.data : error);
      return { listing: this.mockGenerateListing(options), cost: 0 };
    }
  }

  private parseAnalysis(text: string): ImageAnalysis {
    // Extract confidence as a number
    const confMatch = text.match(/confidence[:\s]+(\d+)/i);
    const confidence = confMatch ? parseInt(confMatch[1], 10) : 0;

    // Extract UPC — must be 12-13 digits
    const rawUpc = this.extractField(text, 'upc', 'None');
    const upcDigits = rawUpc.replace(/[^0-9]/g, '');
    const upc = (upcDigits.length === 12 || upcDigits.length === 13) ? upcDigits : undefined;

    // Extract ISBN — must be 10 or 13 digits
    const rawIsbn = this.extractField(text, 'isbn', 'None');
    const isbnDigits = rawIsbn.replace(/[^0-9Xx]/g, '');
    const isbn = (isbnDigits.length === 10 || isbnDigits.length === 13) ? isbnDigits : undefined;

    return {
      itemType: this.extractField(text, 'item', 'Unknown Item'),
      brand: this.extractField(text, 'brand', 'Unbranded'),
      model: this.extractField(text, 'model', undefined),
      condition: this.extractField(text, 'condition', 'Used'),
      features: this.extractField(text, 'features', '').split(',').map(f => f.trim()).filter(Boolean),
      category: this.extractField(text, 'category', 'General'),
      estimatedValue: this.extractField(text, 'value', '$10-50'),
      rawAnalysis: text,
      confidence,
      upc,
      isbn,
    } as ImageAnalysis;
  }

  private parseListing(text: string) {
    return {
      title: this.extractField(text, 'title', 'Item for Sale'),
      description: this.extractDescription(text),
      tags: this.extractField(text, 'tags', '').split(',').map(t => t.trim()).filter(Boolean),
      startingPrice: this.extractPrice(text, 'starting', 9.99),
      buyNowPrice: this.extractPrice(text, 'buy.*now', 29.99),
      shippingCost: this.extractPrice(text, 'shipping', 5.99),
      rawResponse: text
    };
  }

  private extractField(text: string, field: string, defaultValue: string | undefined): string {
    const regex = new RegExp(`${field}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : (defaultValue ?? '');
  }

  private extractDescription(text: string): string {
    const regex = /description:\s*([\s\S]*?)(?=\n(?:tags|starting price|buy|shipping):|$)/i;
    const match = text.match(regex);
    return match ? match[1].trim() : '<p>Item in good condition</p>';
  }

  private extractPrice(text: string, field: string, defaultValue: number): number {
    const regex = new RegExp(`${field}[:\\s]+\\$?([0-9.]+)`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : defaultValue;
  }

  /**
   * Re-analyze selected images with a user correction prompt.
   * Includes all existing item data so Claude can refine its identification.
   */
  async reanalyzeWithPrompt(
    imagePaths: string[],
    userPrompt: string,
    existingAnalysis: ImageAnalysis
  ): Promise<{ analysis: ImageAnalysis; cost: number }> {
    if (!this.anthropicKey) {
      return { analysis: this.mockAnalyzeImage(), cost: 0 };
    }

    const loaded = await Promise.all(imagePaths.map(p => this.loadImage(p)));
    const images = loaded.filter((img): img is { base64: string; mediaType: string } => img !== null);

    if (images.length === 0) {
      return { analysis: existingAnalysis, cost: 0 };
    }

    const content: any[] = [];
    for (const img of images) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 }
      });
    }

    content.push({ type: 'text', text: `You previously analyzed this item and produced the following identification:
---
${existingAnalysis.rawAnalysis}
---

The user is sending ${images.length} photo(s) with the following correction/instruction:

"${userPrompt}"

Re-examine the photos carefully with this guidance. UPDATE your identification to correct any mistakes. Keep all details that were correct, fix what was wrong, and add any new details you can now see.

Respond in this exact format:

Confidence: [0-100]% — how confident you are in a complete, accurate identification
Item: [specific item name with model/version if identifiable]
Brand: [brand name or "Unbranded"]
Model: [model number/name if visible, or "Unknown"]
Condition: [New/Used - Like New/Used - Good/Used - Fair/For Parts]
Features: [feature1, feature2, feature3, feature4, feature5]
Category: [specific eBay category suggestion]
Value: [$XX-$YY estimated market range]
Defects: [list any visible wear, damage, missing parts, or "None visible"]
Keywords: [keyword1, keyword2, keyword3, keyword4, keyword5]
UPC: [12 or 13 digit barcode number if visible on packaging/label/sticker, or "None"]
ISBN: [10 or 13 digit ISBN if visible on a book/media item, or "None"]
Notes: [any additional details that would help a seller write an accurate listing]

IMPORTANT: Look carefully for barcodes, UPC codes, ISBN numbers, or EAN codes on packaging, labels, stickers, or book covers.` });

    console.log(`Reanalyzing ${images.length} photo(s) with correction prompt: "${userPrompt.substring(0, 100)}"...`);

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content }]
    }, {
      headers: {
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 120000,
      maxContentLength: 100 * 1024 * 1024,
      maxBodyLength: 100 * 1024 * 1024
    });

    const analysisText = response.data.content?.[0]?.text || '';
    const usage = response.data.usage || {};
    const cost = calcCost(usage);
    console.log(`  Reanalysis complete (${usage.input_tokens || 0}in/${usage.output_tokens || 0}out tokens, $${cost.toFixed(6)})`);

    return { analysis: this.parseAnalysis(analysisText), cost };
  }

  /**
   * Suggest a price range for an item based on its details.
   */
  async suggestPrice(itemDetails: {
    title: string;
    brand: string;
    condition: string;
    category: string;
    features: string[];
    description: string;
  }): Promise<{ min: number; max: number; confidence: string; reasoning: string }> {
    if (!this.anthropicKey) {
      return { min: 10, max: 50, confidence: 'low', reasoning: 'No AI API key configured — mock suggestion' };
    }

    try {
      const prompt = `You are an experienced eBay seller. Based on the following item details, estimate a realistic sold price range on eBay.

Title: ${itemDetails.title}
Brand: ${itemDetails.brand}
Condition: ${itemDetails.condition}
Category: ${itemDetails.category}
Features: ${itemDetails.features.join(', ')}
Description: ${itemDetails.description.substring(0, 500)}

Respond in this exact format (numbers only, no dollar signs in the min/max lines):
Min: [number]
Max: [number]
Confidence: [low/medium/high]
Reasoning: [1-2 sentence explanation of how you arrived at this range]`;

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const text = response.data.content?.[0]?.text || '';
      const minMatch = text.match(/min[:\s]+\$?(\d+(?:\.\d+)?)/i);
      const maxMatch = text.match(/max[:\s]+\$?(\d+(?:\.\d+)?)/i);
      const confMatch = text.match(/confidence[:\s]+(low|medium|high)/i);
      const reasonMatch = text.match(/reasoning[:\s]+(.+)/i);

      return {
        min: minMatch ? parseFloat(minMatch[1]) : 10,
        max: maxMatch ? parseFloat(maxMatch[1]) : 50,
        confidence: confMatch ? confMatch[1] : 'low',
        reasoning: reasonMatch ? reasonMatch[1].trim() : 'Unable to parse AI response',
      };
    } catch (error) {
      console.error('Price suggestion error:', error);
      return { min: 10, max: 50, confidence: 'low', reasoning: 'AI price suggestion failed' };
    }
  }

  private mockAnalyzeImage(): ImageAnalysis {
    return {
      itemType: 'Sample Item',
      brand: 'Unknown Brand',
      condition: 'Used - Good',
      features: ['Feature 1', 'Feature 2'],
      category: 'Electronics',
      estimatedValue: '$20-50',
      rawAnalysis: 'Mock analysis - No AI API key configured'
    };
  }

  private mockGenerateListing(options: ListingOptions) {
    return {
      title: `${options.imageAnalysis.itemType} - ${options.imageAnalysis.condition}`,
      description: `<p>${options.imageAnalysis.itemType} by ${options.imageAnalysis.brand}. ${options.imageAnalysis.condition}.</p>`,
      tags: options.imageAnalysis.features || ['item'],
      startingPrice: 9.99,
      buyNowPrice: 29.99,
      shippingCost: 7.99,
      rawResponse: 'Mock listing - No AI API key configured'
    };
  }
}

export const aiService = new AIService();
