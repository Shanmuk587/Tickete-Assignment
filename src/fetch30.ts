import pLimit from 'p-limit';
import { setTimeout } from 'timers/promises';
import { fetchAndStoreInventory } from './fetchStore';

/**
 * Fetches and stores data for multiple products across the next 7 days
 * with rate limiting to 30 calls per minute
 * 
 * @param products - Array of product IDs
 * @param callsPerMinute - Number of API calls per minute (default: 30)
 * @param concurrency - Maximum number of concurrent requests (default: 5)
 */
async function fetchNext30Days(
  products: number[],
  callsPerMinute: number = 30,
  concurrency: number = 5
): Promise<void> {
  // Generate dates for the next 7 days
  const dates: string[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    const formattedDate = date.toISOString().split('T')[0];
    dates.push(formattedDate);
  }
  console.log("fetching for next 30 days")
  console.log(`Generated dates: ${dates.join(', ')}`);
  
  // Simple delay between calls in milliseconds
  const delayMs = (60 * 1000) / callsPerMinute;
  
  // Create tasks
  const tasks = products.flatMap(productId => 
    dates.map(date => ({ productId, date }))
  );
  
  console.log(`Processing ${tasks.length} tasks with ${concurrency} concurrent workers at ${callsPerMinute} calls per minute`);
  
  // Create a concurrency limiter
  const limit = pLimit(concurrency);
  
  // Process tasks with concurrency control and simple rate limiting
  const promises = tasks.map(({ productId, date }) => {
    return limit(async () => {
      try {
        // Process the request
        await fetchAndStoreInventory(productId, date);
        console.log(`Completed: Product ${productId} for ${date}`);
        
        // Apply simple rate limiting - just wait the fixed amount
        await setTimeout(delayMs);
      } catch (error) {
        console.error(`Error processing ${productId} for ${date}:`, error);
        // Simple error handling - you could add retry logic here
      }
    });
  });
  
  await Promise.all(promises);
}


export {fetchNext30Days}