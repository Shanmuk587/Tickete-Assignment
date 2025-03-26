// import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import dotenv from 'dotenv'
import prisma from './prismaClient'
dotenv.config()

// const prisma = new PrismaClient()
const API_KEY = process.env.TICKETE_API_KEY
const BASE_URL = 'https://leap-api.tickete.co/api/v1/inventory'

// Interface definitions based on the API response
interface PaxAvailability {
  max: number
  min: number
  remaining: number
  type: string
  isPrimary?: boolean
  description: string
  name: string
  price: {
    discount: number
    finalPrice: number
    originalPrice: number
    currencyCode: string
  }
}

interface SlotData {
  startDate: string
  startTime: string
  endTime: string
  providerSlotId: string
  remaining: number
  currencyCode: string
  variantId: number
  paxAvailability: PaxAvailability[]
}

/**
 * Fetches inventory data for a product on a specific date and stores it in the database
 * @param productId - The ID of the product
 * @param date - The date to fetch inventory for (YYYY-MM-DD)
 */
export async function fetchAndStoreInventory(productId: number, date: string): Promise<void> {
  try {
    // 1. Fetch data from the API
    const response = await axios.get(`${BASE_URL}/${productId}`, {
      params: { date },
      headers: { 'x-api-key': API_KEY }
    })

    const slots: SlotData[] = response.data

    // 3. Get or create the product
    const product = await prisma.product.upsert({
      where: { id: productId },
      update: {},
      create: { id: productId }
    })

    // 4. Get or create the dateAvailability
    const dateObj = new Date(date)
    const dateAvailability = await prisma.dateAvailability.upsert({
      where: {
        productId_date: {
          productId: product.id,
          date: dateObj
        }
      },
      update: {},
      create: {
        productId: product.id,
        date: dateObj
      }
    })

    // 5. Process each slot
    for (const slotData of slots) {
      // 6. Create or update the slot
      const slot = await prisma.slot.upsert({
        where: {
          dateAvailabilityId_startTime: {
            dateAvailabilityId: dateAvailability.id,
            startTime: slotData.startTime
          }
        },
        update: {
          endTime: slotData.endTime,
          providerSlotId: slotData.providerSlotId,
          remaining: slotData.remaining,
          currencyCode: slotData.currencyCode,
          variantId: slotData.variantId
        },
        create: {
          dateAvailabilityId: dateAvailability.id,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          providerSlotId: slotData.providerSlotId,
          remaining: slotData.remaining,
          currencyCode: slotData.currencyCode,
          variantId: slotData.variantId
        }
      })

      // 7. Process each pax type in the slot
      for (const paxData of slotData.paxAvailability) {
        // 8. Get or create the pax type
        const paxType = await prisma.paxType.upsert({
          where: { type: paxData.type },
          update: {
            name: paxData.name,
            description: paxData.description
          },
          create: {
            type: paxData.type,
            name: paxData.name,
            description: paxData.description
          }
        })

        // 9. Create or update the slot pax availability
        await prisma.slotPaxAvailability.upsert({
          where: {
            slotId_paxTypeId: {
              slotId: slot.id,
              paxTypeId: paxType.id
            }
          },
          update: {
            min: paxData.min,
            max: paxData.max,
            remaining: paxData.remaining,
            isPrimary: paxData.isPrimary,
            priceFinal: paxData.price.finalPrice,
            priceOriginal: paxData.price.originalPrice,
            priceDiscount: paxData.price.discount,
            priceCurrency: paxData.price.currencyCode
          },
          create: {
            slotId: slot.id,
            paxTypeId: paxType.id,
            min: paxData.min,
            max: paxData.max,
            remaining: paxData.remaining,
            isPrimary: paxData.isPrimary,
            priceFinal: paxData.price.finalPrice,
            priceOriginal: paxData.price.originalPrice,
            priceDiscount: paxData.price.discount,
            priceCurrency: paxData.price.currencyCode
          }
        })
      }
    }

    console.log(`Successfully fetched and stored inventory for product ${productId} on ${date}`)
  } catch (error) {
    console.error('Error fetching and storing inventory:', error)
    throw error
  }
}

// // Example usage
// async function main() {
//   try {
//     // Example: Fetch inventory for product ID 225532707686 on March 23, 2025
//     await fetchAndStoreInventory(15, '2025-03-23')
//     console.log('Data fetched and stored successfully')
//   } catch (error) {
//     console.error('Error in main function:', error)
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// // Run the script if it's called directly
// if (require.main === module) {
//   main()
// }

// export { fetchAndStoreInventory };