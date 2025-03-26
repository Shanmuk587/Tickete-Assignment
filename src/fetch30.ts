import pLimit from 'p-limit';
import { setTimeout } from 'timers/promises';
import { fetchAndStoreInventory } from './fetchStore';


async function fetchNext30Days(
  products: number[],
  callsPerMinute: number = 30,
  concurrency: number = 5
): Promise<void> {
  // Generating dates for the next 7 days
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
  
  // delay between calls in milliseconds
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
        
        // Ratelimiting
        await setTimeout(delayMs);
      } catch (error) {
        console.error(`Error processing ${productId} for ${date}:`, error);
      }
    });
  });
  
  await Promise.all(promises);
}


export {fetchNext30Days}