"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNext7Days = fetchNext7Days;
const p_limit_1 = __importDefault(require("p-limit"));
const promises_1 = require("timers/promises");
const fetchStore_1 = require("./fetchStore");
/**
 * Fetches and stores data for multiple products across the next 7 days
 * with rate limiting to 30 calls per minute
 *
 * @param products - Array of product IDs
 * @param callsPerMinute - Number of API calls per minute (default: 30)
 * @param concurrency - Maximum number of concurrent requests (default: 5)
 */
async function fetchNext7Days(products, callsPerMinute = 30, concurrency = 5) {
    // Generate dates for the next 7 days
    const dates = [];
    const currentDate = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        dates.push(formattedDate);
    }
    console.log("fetching for next 7days");
    console.log(`Generated dates: ${dates.join(', ')}`);
    // Simple delay between calls in milliseconds
    const delayMs = (60 * 1000) / callsPerMinute;
    // Create tasks
    const tasks = products.flatMap(productId => dates.map(date => ({ productId, date })));
    console.log(`Processing ${tasks.length} tasks with ${concurrency} concurrent workers at ${callsPerMinute} calls per minute`);
    // Create a concurrency limiter
    const limit = (0, p_limit_1.default)(concurrency);
    // Process tasks with concurrency control and simple rate limiting
    const promises = tasks.map(({ productId, date }) => {
        return limit(async () => {
            try {
                // Process the request
                await (0, fetchStore_1.fetchAndStoreInventory)(productId, date);
                console.log(`Completed: Product ${productId} for ${date}`);
                // Apply simple rate limiting - just wait the fixed amount
                await (0, promises_1.setTimeout)(delayMs);
            }
            catch (error) {
                console.error(`Error processing ${productId} for ${date}:`, error);
                // Simple error handling - you could add retry logic here
            }
        });
    });
    await Promise.all(promises);
}
