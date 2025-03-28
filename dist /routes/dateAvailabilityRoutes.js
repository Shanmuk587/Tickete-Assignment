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
const express_1 = __importDefault(require("express"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const router = express_1.default.Router();
// Route to get the Get Date Availabilities for a ProductID
router.get('/product/:productId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const dateAvailabilities = yield prismaClient_1.default.dateAvailability.findMany({
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
        const transformedDates = dateAvailabilities.map((dateAvailability) => {
            const variantIds = [
                ...new Set(dateAvailability.slots.flatMap((slot) => slot.variantId ? [slot.variantId] : [])),
            ];
            const firstSlot = dateAvailability.slots[0];
            const firstPaxAvailability = firstSlot === null || firstSlot === void 0 ? void 0 : firstSlot.slotPaxAvailabilities[0];
            return {
                date: dateAvailability.date.toISOString().split('T')[0],
                price: {
                    currencyCode: (firstPaxAvailability === null || firstPaxAvailability === void 0 ? void 0 : firstPaxAvailability.priceCurrency) || null,
                    discount: (firstPaxAvailability === null || firstPaxAvailability === void 0 ? void 0 : firstPaxAvailability.priceDiscount) || 0,
                    finalPrice: (firstPaxAvailability === null || firstPaxAvailability === void 0 ? void 0 : firstPaxAvailability.priceFinal) || null,
                    originalPrice: (firstPaxAvailability === null || firstPaxAvailability === void 0 ? void 0 : firstPaxAvailability.priceOriginal) || null,
                },
                variantIds,
            };
        });
        res.json({
            dates: transformedDates,
        });
    }
    catch (error) {
        console.error('Error fetching date availabilities:', error);
        res.status(500).json({ error: error.message });
    }
}));
router.get('/product/:productId/date/:date', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Parse the date and product ID
        const productId = parseInt(req.params.productId);
        const dateString = req.params.date;
        // First, find the specific DateAvailability record
        const dateAvailability = yield prismaClient_1.default.dateAvailability.findFirst({
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
        const slots = yield prismaClient_1.default.slot.findMany({
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
        const transformedSlots = slots.map((slot) => {
            // Find the first pax availability's price details
            const firstPaxAvail = slot.slotPaxAvailabilities[0];
            return {
                startTime: slot.startTime,
                startDate: dateString,
                price: {
                    finalPrice: (firstPaxAvail === null || firstPaxAvail === void 0 ? void 0 : firstPaxAvail.priceFinal) || 0,
                    currencyCode: (firstPaxAvail === null || firstPaxAvail === void 0 ? void 0 : firstPaxAvail.priceCurrency) || 'GBP',
                    originalPrice: (firstPaxAvail === null || firstPaxAvail === void 0 ? void 0 : firstPaxAvail.priceOriginal) || 0,
                },
                remaining: slot.remaining,
                paxAvailability: slot.slotPaxAvailabilities.map((paxAvail) => ({
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
    }
    catch (error) {
        console.error('Error fetching slot availabilities:', error);
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
