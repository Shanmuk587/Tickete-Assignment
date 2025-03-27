import express, { Request, Response } from 'express';
import prisma from '../prismaClient';

const router = express.Router();

// Route to get the Get Date Availabilities for a ProductID
router.get('/product/:productId', async (req: any, res: any) => {
  try {
    const productId: any = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const dateAvailabilities: any = await prisma.dateAvailability.findMany({
      where: {
        productId: productId,
      },
      include: {
        slots: {
          include: {
            slotPaxAvailabilities: {
              include: {
                paxType: true,
              },
            },
          },
        },
      },
    });

    const transformedDates: any = dateAvailabilities.map((dateAvailability: any) => {
      const variantIds: any = [
        ...new Set(
          dateAvailability.slots.flatMap((slot: any) =>
            slot.variantId ? [slot.variantId] : []
          )
        ),
      ];
      const firstSlot: any = dateAvailability.slots[0];
      const firstPaxAvailability: any = firstSlot?.slotPaxAvailabilities[0];
      return {
        date: dateAvailability.date.toISOString().split('T')[0],
        price: {
          currencyCode: firstPaxAvailability?.priceCurrency || null,
          discount: firstPaxAvailability?.priceDiscount || 0,
          finalPrice: firstPaxAvailability?.priceFinal || null,
          originalPrice: firstPaxAvailability?.priceOriginal || null,
        },
        variantIds,
      };
    });

    res.json({
      dates: transformedDates,
    });
  } catch (error: any) {
    console.error('Error fetching date availabilities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Type definitions to ensure the desired response format
type Price = {
  finalPrice: number;
  currencyCode: string;
  originalPrice: number;
};

type PaxAvailability = {
  type: string;
  name?: string | null;
  description?: string | null;
  price: Price;
  min?: number | null;
  max?: number | null;
  remaining: number;
};

type TransformedSlot = {
  startTime: string;
  startDate: string;
  price: Price;
  remaining: number;
  paxAvailability: PaxAvailability[];
};

router.get('/product/:productId/date/:date', async (req: any, res: any) => {
  try {
    // Parse the date and product ID
    const productId: any = parseInt(req.params.productId);
    const dateString: any = req.params.date;

    // First, find the specific DateAvailability record
    const dateAvailability: any = await prisma.dateAvailability.findFirst({
      where: {
        productId: productId,
        date: new Date(dateString),
      },
    });

    // If no date availability found, return empty result
    if (!dateAvailability) {
      return res.json({ slots: [] });
    }

    // Fetch slots with detailed pax availabilities
    const slots: any = await prisma.slot.findMany({
      where: {
        dateAvailabilityId: dateAvailability.id,
      },
      include: {
        slotPaxAvailabilities: {
          include: {
            paxType: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc', // Ordering slots by start time
      },
    });

    // Transform slots to desired output format
    const transformedSlots: TransformedSlot[] = slots.map((slot: any) => {
      // Find the first pax availability's price details
      const firstPaxAvail: any = slot.slotPaxAvailabilities[0];

      return {
        startTime: slot.startTime,
        startDate: dateString,
        price: {
          finalPrice: firstPaxAvail?.priceFinal || 0,
          currencyCode: firstPaxAvail?.priceCurrency || 'GBP',
          originalPrice: firstPaxAvail?.priceOriginal || 0,
        },
        remaining: slot.remaining,
        paxAvailability: slot.slotPaxAvailabilities.map((paxAvail: any) => ({
          type: paxAvail.paxType.type,
          name: paxAvail.paxType.name || undefined,
          description: paxAvail.paxType.description || undefined,
          price: {
            finalPrice: paxAvail.priceFinal,
            currencyCode: paxAvail.priceCurrency,
            originalPrice: paxAvail.priceOriginal,
          },
          min: paxAvail.min,
          max: paxAvail.max,
          remaining: paxAvail.remaining,
        })),
      };
    });

    res.json({ slots: transformedSlots });
  } catch (error: any) {
    console.error('Error fetching slot availabilities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
