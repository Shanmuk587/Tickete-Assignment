"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndStoreInventory = fetchAndStoreInventory;
// import { PrismaClient } from '@prisma/client'
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const prismaClient_1 = __importDefault(require("./prismaClient"));
dotenv_1.default.config();
// const prisma = new PrismaClient()
const API_KEY = process.env.TICKETE_API_KEY;
const BASE_URL = 'https://leap-api.tickete.co/api/v1/inventory';
/**
 * Fetches inventory data for a product on a specific date and stores it in the database
 * @param productId - The ID of the product
 * @param date - The date to fetch inventory for (YYYY-MM-DD)
 */
async function fetchAndStoreInventory(productId, date) {
    try {
        // 1. Fetch data from the API
        const response = await axios_1.default.get(`${BASE_URL}/${productId}`, {
            params: { date },
            headers: { 'x-api-key': API_KEY }
        });
        const slots = response.data;
        // 3. Get or create the product
        const product = await prismaClient_1.default.product.upsert({
            where: { id: productId },
            update: {},
            create: { id: productId }
        });
        // 4. Get or create the dateAvailability
        const dateObj = new Date(date);
        const dateAvailability = await prismaClient_1.default.dateAvailability.upsert({
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
        });
        // 5. Process each slot
        for (const slotData of slots) {
            // 6. Create or update the slot
            const slot = await prismaClient_1.default.slot.upsert({
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
            });
            // 7. Process each pax type in the slot
            for (const paxData of slotData.paxAvailability) {
                // 8. Get or create the pax type
                const paxType = await prismaClient_1.default.paxType.upsert({
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
                });
                // 9. Create or update the slot pax availability
                await prismaClient_1.default.slotPaxAvailability.upsert({
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
                });
            }
        }
        console.log(`Successfully fetched and stored inventory for product ${productId} on ${date}`);
    }
    catch (error) {
        console.error('Error fetching and storing inventory:', error);
        throw error;
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
