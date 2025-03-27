"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNext30Days = fetchNext30Days;
const p_limit_1 = __importDefault(require("p-limit"));
const promises_1 = require("timers/promises");
const fetchStore_1 = require("./fetchStore");
async function fetchNext30Days(products, callsPerMinute = 30, concurrency = 1) {
    // Generating dates for the next 7 days
    const dates = [];
    const currentDate = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        dates.push(formattedDate);
    }
    console.log("fetching for next 30 days");
    console.log(`Generated dates: ${dates.join(', ')}`);
    // delay between calls in milliseconds
    const delayMs = (60 * 1000) / callsPerMinute;
    // Create tasks
    const tasks = products.flatMap(productId => dates.map(date => ({ productId, date })));
    console.log(`Processing ${tasks.length} tasks with ${concurrency} concurrent workers at ${callsPerMinute} calls per minute`);
    // Concurrency Limits:
    // If the background promises grow too many at once, you could overwhelm the DB or the system. To prevent this, you can track and limit the number of active promises
    const limit = (0, p_limit_1.default)(concurrency);
    // Processing tasks with concurrency control and simple rate limiting, to avoid server overvelming
    const promises = tasks.map(({ productId, date }) => {
        return limit(async () => {
            try {
                // Processing the request
                (0, fetchStore_1.fetchAndStoreInventory)(productId, date);
                console.log(`Completed: Product ${productId} for ${date}`);
                // Ratelimiting
                await (0, promises_1.setTimeout)(delayMs);
            }
            catch (error) {
                console.error(`Error processing ${productId} for ${date}:`, error);
            }
        });
    });
    // We can try increasing the thread pool limit (can be concluded through metrics), as there will be lot more asynchronous functions
    await Promise.all(promises);
}
