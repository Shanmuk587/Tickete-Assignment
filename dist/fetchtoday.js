"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchFetchInventory = batchFetchInventory;
const fetchStore_1 = require("./fetchStore"); // Path to your fetch function
const p_limit_1 = __importDefault(require("p-limit"));
// p-limit should be downgraded version (npm install p-limit@3.1.0) - compatible issue- es module error
const date_fns_1 = require("date-fns");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// List of product IDs to fetch inventory for
const productIds = [14, 15];
/**
 * Fetches inventory for multiple products with rate limiting
 */
async function batchFetchInventory() {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        // Create rate limiter: 30 requests per minute (1 request per 2 seconds)
        const limit = (0, p_limit_1.default)(5); // Only 5 concurrent request
        const requestDelay = 2000; // 2 seconds between requests
        console.log(`Starting batch inventory fetch on today i.e ${today} for ${productIds.length} products`);
        // Create an array of promises with rate limiting - to not overvelm the server with too many - Controls the number of promises running at a time
        // just using settimeout for function calls - Inefficient for large-scale tasks: Since there's no centralized control, you'll quickly run into resource bottlenecks or server rate limits for larger tasks.
        const promises = productIds.map((productId, index) => {
            return limit(async () => {
                try {
                    // Add delay between API calls for rate limiting
                    if (index > 0) {
                        await new Promise(resolve => setTimeout(resolve, requestDelay));
                    }
                    console.log(`Fetching inventory for product ${productId}...`);
                    await (0, fetchStore_1.fetchAndStoreInventory)(productId, today);
                    console.log(`✅ Successfully fetched inventory for product ${productId}`);
                    return { productId, success: true };
                }
                catch (error) {
                    // Type checking for error - handling both Error objects and other error types
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`❌ Failed to fetch inventory for product ${productId}:`, errorMessage);
                    return { productId, success: false, error: errorMessage };
                }
            });
        });
        // Wait for all requests to complete
        const results = await Promise.all(promises);
        // Summarize results
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log('\n--- BATCH FETCH SUMMARY ---');
        console.log(`Total products: ${productIds.length}`);
        console.log(`Successful fetches: ${successful}`);
        console.log(`Failed fetches: ${failed}`);
        if (failed > 0) {
            console.log('\nFailed product IDs:');
            results
                .filter(r => !r.success)
                .forEach(r => console.log(`- Product ${r.productId}: ${r.error}`));
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Batch fetch operation failed:', errorMessage);
    }
}
