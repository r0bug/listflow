import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { ebayService } from '../services/ebay.service';
import { prisma } from '../config/database';

export const generateListing = async (req: Request, res: Response) => {
  try {
    const { imageAnalysis, category, condition } = req.body;
    
    const listing = await aiService.generateListing({
      imageAnalysis,
      category,
      condition
    });

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error generating listing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate listing' 
    });
  }
};

export const createEbayListing = async (req: Request, res: Response) => {
  try {
    const listingData = req.body;
    
    const ebayResponse = await ebayService.createListing(listingData);
    
    if (prisma) {
      await prisma.listing.create({
        data: {
          title: listingData.title,
          description: listingData.description,
          price: listingData.price,
          ebayId: ebayResponse.listingId,
          status: 'active',
          imageUrls: listingData.imageUrls,
          metadata: listingData
        }
      });
    }

    res.json({
      success: true,
      data: ebayResponse
    });
  } catch (error) {
    console.error('Error creating eBay listing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create eBay listing' 
    });
  }
};

export const getListingHistory = async (req: Request, res: Response) => {
  try {
    if (!prisma) {
      return res.json({ success: true, data: [] });
    }

    const listings = await prisma.listing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching listing history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch listing history' 
    });
  }
};

export const getListingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!prisma) {
      return res.status(404).json({ 
        success: false,
        error: 'Database not configured' 
      });
    }

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ 
        success: false,
        error: 'Listing not found' 
      });
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch listing' 
    });
  }
};