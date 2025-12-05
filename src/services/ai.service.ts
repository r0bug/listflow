import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

interface ListingOptions {
  imageAnalysis: any;
  category?: string;
  condition?: string;
}

interface SegmindConfig {
  apiKey: string;
  model: 'llava-v1.6' | 'claude-3.7-sonnet' | 'claude-3-opus';
  baseUrl: string;
}

class AIService {
  private segmindConfig: SegmindConfig | null = null;
  private modelEndpoints = {
    'llava-v1.6': 'https://api.segmind.com/v1/llava-v1.6',
    'claude-3.7-sonnet': 'https://api.segmind.com/v1/claude-3.7-sonnet',
    'claude-3-opus': 'https://api.segmind.com/v1/claude-3-opus'
  };

  constructor() {
    if (process.env.SEGMIND_API_KEY) {
      this.segmindConfig = {
        apiKey: process.env.SEGMIND_API_KEY,
        model: (process.env.SEGMIND_MODEL as any) || 'llava-v1.6',
        baseUrl: process.env.SEGMIND_BASE_URL || 'https://api.segmind.com/v1'
      };
    }
  }

  async analyzeImage(imagePath: string) {
    if (!this.segmindConfig) {
      return this.mockAnalyzeImage();
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const prompt = `Analyze this item for an eBay listing. Provide a detailed analysis including:
1. Item identification (what is it exactly?)
2. Brand name if visible
3. Condition assessment (new/used/damaged/refurbished)
4. Notable features and specifications
5. Suggested eBay category
6. Estimated market value range
7. Any defects or issues visible
8. Recommended listing keywords

Be specific and detailed in your analysis.`;

      const endpoint = this.modelEndpoints[this.segmindConfig.model];
      
      let requestPayload: any;
      
      // Different payload formats for different models
      if (this.segmindConfig.model === 'llava-v1.6') {
        requestPayload = {
          image: base64Image,
          prompt: prompt,
          max_tokens: 1000,
          temperature: 0.7
        };
      } else if (this.segmindConfig.model.includes('claude')) {
        requestPayload = {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt
                },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        };
      }

      const response = await axios.post(endpoint, requestPayload, {
        headers: {
          'x-api-key': this.segmindConfig.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      let analysisText = '';
      
      // Extract text based on response format
      if (response.data.choices) {
        analysisText = response.data.choices[0].message?.content || response.data.choices[0].text || '';
      } else if (response.data.content) {
        analysisText = response.data.content;
      } else if (response.data.generated_text) {
        analysisText = response.data.generated_text;
      } else if (typeof response.data === 'string') {
        analysisText = response.data;
      }

      return this.parseAnalysis(analysisText);
    } catch (error) {
      console.error('Error analyzing image with Segmind:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
      return this.mockAnalyzeImage();
    }
  }

  async generateListing(options: ListingOptions) {
    if (!this.segmindConfig) {
      return this.mockGenerateListing(options);
    }

    try {
      const prompt = `You are an expert eBay seller. Create a compelling, honest, and SEO-optimized listing based on this information:

Item Analysis: ${JSON.stringify(options.imageAnalysis)}
Category: ${options.category || 'Auto-detect'}
Condition: ${options.condition || options.imageAnalysis.condition}

Generate a complete eBay listing with:
1. Title (maximum 80 characters, SEO optimized with key search terms)
2. Description (detailed HTML formatted description including specifications, features, condition details)
3. Search tags (comma separated keywords for visibility)
4. Suggested starting price (competitive market price)
5. Buy it now price (reasonable markup from starting price)
6. Shipping cost estimate (based on item size/weight)

Format the response clearly with labeled sections.`;

      const endpoint = this.modelEndpoints[this.segmindConfig.model];
      
      let requestPayload: any;
      
      if (this.segmindConfig.model === 'llava-v1.6') {
        requestPayload = {
          prompt: prompt,
          max_tokens: 1500,
          temperature: 0.7
        };
      } else if (this.segmindConfig.model.includes('claude')) {
        requestPayload = {
          messages: [
            {
              role: "system",
              content: "You are an expert eBay seller. Create compelling, honest, and SEO-optimized listings."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        };
      }

      const response = await axios.post(endpoint, requestPayload, {
        headers: {
          'x-api-key': this.segmindConfig.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      let listingText = '';
      
      // Extract text based on response format
      if (response.data.choices) {
        listingText = response.data.choices[0].message?.content || response.data.choices[0].text || '';
      } else if (response.data.content) {
        listingText = response.data.content;
      } else if (response.data.generated_text) {
        listingText = response.data.generated_text;
      } else if (typeof response.data === 'string') {
        listingText = response.data;
      }

      return this.parseListing(listingText);
    } catch (error) {
      console.error('Error generating listing with Segmind:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
      }
      return this.mockGenerateListing(options);
    }
  }

  private parseAnalysis(text: string) {
    return {
      itemType: this.extractField(text, 'item', 'Unknown Item'),
      brand: this.extractField(text, 'brand', 'Unbranded'),
      condition: this.extractField(text, 'condition', 'Used'),
      features: this.extractField(text, 'features', '').split(',').map(f => f.trim()).filter(Boolean),
      category: this.extractField(text, 'category', 'General'),
      estimatedValue: this.extractField(text, 'value', '$10-50'),
      rawAnalysis: text
    };
  }

  private parseListing(text: string) {
    return {
      title: this.extractField(text, 'title', 'Item for Sale'),
      description: this.extractField(text, 'description', '<p>Item in good condition</p>'),
      tags: this.extractField(text, 'tags', '').split(',').map(t => t.trim()).filter(Boolean),
      startingPrice: this.extractPrice(text, 'starting', 9.99),
      buyNowPrice: this.extractPrice(text, 'buy.*now', 29.99),
      shippingCost: this.extractPrice(text, 'shipping', 5.99),
      rawResponse: text
    };
  }

  private extractField(text: string, field: string, defaultValue: string): string {
    const regex = new RegExp(`${field}[:\\s]+([^\\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : defaultValue;
  }

  private extractPrice(text: string, field: string, defaultValue: number): number {
    const regex = new RegExp(`${field}[:\\s]+\\$?([0-9.]+)`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : defaultValue;
  }

  private mockAnalyzeImage() {
    return {
      itemType: 'Sample Item',
      brand: 'Unknown Brand',
      condition: 'Used - Good',
      features: ['Feature 1', 'Feature 2'],
      category: 'Electronics',
      estimatedValue: '$20-50',
      rawAnalysis: 'Mock analysis - Configure OPENAI_API_KEY for real analysis'
    };
  }

  private mockGenerateListing(options: ListingOptions) {
    return {
      title: 'Sample Item - Great Condition - Fast Shipping',
      description: `<h2>Item Description</h2>
        <p>This is a sample listing. Configure your AI API key for real listings.</p>
        <h3>Features:</h3>
        <ul>
          <li>Excellent condition</li>
          <li>Fast shipping</li>
          <li>Satisfaction guaranteed</li>
        </ul>`,
      tags: ['sample', 'test', 'item'],
      startingPrice: 19.99,
      buyNowPrice: 49.99,
      shippingCost: 7.99,
      rawResponse: 'Mock listing - Configure OPENAI_API_KEY for real generation'
    };
  }
}

export const aiService = new AIService();