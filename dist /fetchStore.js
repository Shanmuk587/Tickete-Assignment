"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const API_KEY = process.env.TICKETE_API_KEY;
const BASE_URL = 'https://leap-api.tickete.co/api/v1/inventory';
function fetchAndStoreInventory(productId, date) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetching data from the API
            const response = yield axios_1.default.get(`${BASE_URL}/${productId}`, {
                params: { date },
                headers: { 'x-api-key': API_KEY }
            });
            const slots = response.data;
            // creating the product
            const product = yield prismaClient_1.default.product.upsert({
                where: { id: productId },
                update: {},
                create: { id: productId }
            });
            // dateAvailability
            const dateObj = new Date(date);
            const dateAvailability = yield prismaClient_1.default.dateAvailability.upsert({
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
            // Processing each slot
            for (const slotData of slots) {
                // 6. Create or update the slot
                const slot = yield prismaClient_1.default.slot.upsert({
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
                // Processing each pax type in the slot
                for (const paxData of slotData.paxAvailability) {
                    const paxType = yield prismaClient_1.default.paxType.upsert({
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
                    // slot pax availability
                    yield prismaClient_1.default.slotPaxAvailability.upsert({
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
    });
}
