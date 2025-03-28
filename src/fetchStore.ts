import axios from 'axios'
import dotenv from 'dotenv'
import prisma from './prismaClient'
dotenv.config()

const API_KEY = process.env.TICKETE_API_KEY
const BASE_URL = 'https://leap-api.tickete.co/api/v1/inventory'

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

export async function fetchAndStoreInventory(productId: number, date: string): Promise<void> {
  try {
    const response = await axios.get(`${BASE_URL}/${productId}`, {
      params: { date },
      headers: { 'x-api-key': API_KEY }
    })

    const slots: SlotData[] = response.data

    // Preprocessing the data before writing to the database
    const dateObj = new Date(date)
    const processedData = {
      productId,
      date: dateObj,
      slots: slots.map(slotData => ({
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        providerSlotId: slotData.providerSlotId,
        remaining: slotData.remaining,
        currencyCode: slotData.currencyCode,
        variantId: slotData.variantId,
        paxTypes: slotData.paxAvailability.map(paxData => ({
          type: paxData.type,
          name: paxData.name,
          description: paxData.description,
          availability: {
            min: paxData.min,
            max: paxData.max,
            remaining: paxData.remaining,
            isPrimary: paxData.isPrimary,
            price: {
              final: paxData.price.finalPrice,
              original: paxData.price.originalPrice,
              discount: paxData.price.discount,
              currency: paxData.price.currencyCode
            }
          }
        }))
      }))
    }

    // Using nested writes to reduce database queries
    await prisma.product.upsert({
      where: { id: productId },
      update: {},
      create: { id: productId },
      // include: {
      //   DateAvailability: true
      // }
    })

    await prisma.dateAvailability.upsert({
      where: {
        productId_date: {
          productId: productId,
          date: dateObj
        }
      },
      update: {},
      create: {
        productId: productId,
        date: dateObj,
        slots: {
          create: processedData.slots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            providerSlotId: slot.providerSlotId,
            remaining: slot.remaining,
            currencyCode: slot.currencyCode,
            variantId: slot.variantId,
            slotPaxAvailability: {
              create: slot.paxTypes.map(paxType => ({
                paxType: {
                  connectOrCreate: {
                    where: { type: paxType.type },
                    create: {
                      type: paxType.type,
                      name: paxType.name,
                      description: paxType.description
                    }
                  }
                },
                min: paxType.availability.min,
                max: paxType.availability.max,
                remaining: paxType.availability.remaining,
                isPrimary: paxType.availability.isPrimary,
                priceFinal: paxType.availability.price.final,
                priceOriginal: paxType.availability.price.original,
                priceDiscount: paxType.availability.price.discount,
                priceCurrency: paxType.availability.price.currency
              }))
            }
          }))
        }
      }
    })

    console.log(`Successfully fetched and stored inventory for product ${productId} on ${date}`)
  } catch (error) {
    console.error('Error fetching and storing inventory:', error)
    throw error
  }
}

// // import { PrismaClient } from '@prisma/client'
// import axios from 'axios'
// import dotenv from 'dotenv'
// import prisma from './prismaClient'
// dotenv.config()


// const API_KEY = process.env.TICKETE_API_KEY
// const BASE_URL = 'https://leap-api.tickete.co/api/v1/inventory'

// // Interface definitions based on the API response
// interface PaxAvailability {
//   max: number
//   min: number
//   remaining: number
//   type: string
//   isPrimary?: boolean
//   description: string
//   name: string
//   price: {
//     discount: number
//     finalPrice: number
//     originalPrice: number
//     currencyCode: string
//   }
// }

// interface SlotData {
//   startDate: string
//   startTime: string
//   endTime: string
//   providerSlotId: string
//   remaining: number
//   currencyCode: string
//   variantId: number
//   paxAvailability: PaxAvailability[]
// }

// export async function fetchAndStoreInventory(productId: number, date: string): Promise<void> {
//   try {
//     // Fetching data from the API
//     const response = await axios.get(`${BASE_URL}/${productId}`, {
//       params: { date },
//       headers: { 'x-api-key': API_KEY }
//     })

//     const slots: SlotData[] = response.data

//     // creating the product
//     const product = await prisma.product.upsert({
//       where: { id: productId },
//       update: {},
//       create: { id: productId }
//     })

//     // dateAvailability
//     const dateObj = new Date(date)
//     const dateAvailability = await prisma.dateAvailability.upsert({
//       where: {
//         productId_date: {
//           productId: product.id,
//           date: dateObj
//         }
//       },
//       update: {},
//       create: {
//         productId: product.id,
//         date: dateObj
//       }
//     })

//     // Processing each slot
//     for (const slotData of slots) {
//       // 6. Create or update the slot
//       const slot = await prisma.slot.upsert({
//         where: {
//           dateAvailabilityId_startTime: {
//             dateAvailabilityId: dateAvailability.id,
//             startTime: slotData.startTime
//           }
//         },
//         update: {
//           endTime: slotData.endTime,
//           providerSlotId: slotData.providerSlotId,
//           remaining: slotData.remaining,
//           currencyCode: slotData.currencyCode,
//           variantId: slotData.variantId
//         },
//         create: {
//           dateAvailabilityId: dateAvailability.id,
//           startTime: slotData.startTime,
//           endTime: slotData.endTime,
//           providerSlotId: slotData.providerSlotId,
//           remaining: slotData.remaining,
//           currencyCode: slotData.currencyCode,
//           variantId: slotData.variantId
//         }
//       })

//       // Processing each pax type in the slot
//       for (const paxData of slotData.paxAvailability) {
//         const paxType = await prisma.paxType.upsert({
//           where: { type: paxData.type },
//           update: {
//             name: paxData.name,
//             description: paxData.description
//           },
//           create: {
//             type: paxData.type,
//             name: paxData.name,
//             description: paxData.description
//           }
//         })

//         // slot pax availability
//         await prisma.slotPaxAvailability.upsert({
//           where: {
//             slotId_paxTypeId: {
//               slotId: slot.id,
//               paxTypeId: paxType.id
//             }
//           },
//           update: {
//             min: paxData.min,
//             max: paxData.max,
//             remaining: paxData.remaining,
//             isPrimary: paxData.isPrimary,
//             priceFinal: paxData.price.finalPrice,
//             priceOriginal: paxData.price.originalPrice,
//             priceDiscount: paxData.price.discount,
//             priceCurrency: paxData.price.currencyCode
//           },
//           create: {
//             slotId: slot.id,
//             paxTypeId: paxType.id,
//             min: paxData.min,
//             max: paxData.max,
//             remaining: paxData.remaining,
//             isPrimary: paxData.isPrimary,
//             priceFinal: paxData.price.finalPrice,
//             priceOriginal: paxData.price.originalPrice,
//             priceDiscount: paxData.price.discount,
//             priceCurrency: paxData.price.currencyCode
//           }
//         })
//       }
//     }

//     console.log(`Successfully fetched and stored inventory for product ${productId} on ${date}`)
//   } catch (error) {
//     console.error('Error fetching and storing inventory:', error)
//     throw error
//   }
// }
