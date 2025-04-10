import { fetchAndStoreInventory } from './fetchStore'; // Path to your fetch function
import pLimit from 'p-limit';
// p-limit should be downgraded version (npm install p-limit@3.1.0) - compatible issue- es module error
import { format } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

// List of product IDs to fetch inventory for
const productIds = [14,15];


async function batchFetchInventory() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Create rate limiter: 30 requests per minute (1 request per 2 seconds)
    const limit = pLimit(1); // Only 1 concurrent request
    const requestDelay = 2000; // 2 seconds between requests

    console.log(`Starting batch inventory fetch on today i.e ${today} for ${productIds.length} products`);
    
    // Create an array of promises with rate limiting - to not overvelm the server with too many - Controls the number of promises running at a time
    // just using settimeout for function calls - Inefficient for large-scale tasks: Since there's no centralized control, you'll quickly run into resource bottlenecks or server rate limits for larger tasks.
    const promises = productIds.map((productId, index) => {
      return limit(async () => {
        try {
          // Adding delay between API calls for rate limiting
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, requestDelay));
          }
          
          console.log(`Fetching inventory for product ${productId}...`);
          fetchAndStoreInventory(productId, today);
          console.log(`Successfully fetched inventory for product ${productId}`);
          return { productId, success: true };
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to fetch inventory for product ${productId}:`, errorMessage);
          return { productId, success: false, error: errorMessage };
        }
      });
    });
    
    // Waiting for all requests to complete, 1 at a time
    const results = await Promise.all(promises);
    
    // Summarizing the results
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Batch fetch operation failed:', errorMessage);
  }
}


export { batchFetchInventory };