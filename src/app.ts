import express from 'express';
import { EventEmitter } from 'events';
import cron from 'node-cron';
import dateAvailabilityRoutes from './routes/dateAvailabilityRoutes'
// Import existing functions
import { batchFetchInventory } from './fetchtoday';
import { fetchNext30Days } from './fetch30';
import { fetchNext7Days } from './fetch7';

let isPaused: boolean = false;

// Increase max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;

// Custom Queue Class for managing task processing
class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async enqueue(task: () => Promise<void>) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    // Prevent concurrent processing
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Task processing error:', error);
        }
      }
    }

    this.isProcessing = false;
  }
}

// Create a global task queue
const globalTaskQueue = new TaskQueue();

// Logging utility
function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Configuration for product IDs
const PRODUCT_IDS = { // Example product IDs
  NEXT_7_DAYS: [14,15],     // Example product IDs
  NEXT_30_DAYS: [14,15]
};

// Wrapper functions for existing tasks
class ScheduledFunctions {
  // Function 1 - Runs every 15 minutes
  static async scheduleFun1() {
    await globalTaskQueue.enqueue(async () => {
      log('Executing batchFetchInventory - Batch Fetch Inventory');
      await batchFetchInventory();
    });
  }

  // Function 2 - Runs every 4 hours
  static async scheduleFun2() {
    await globalTaskQueue.enqueue(async () => {
      log('Executing fetchNext7Days - Fetch Next 7 Days');
      await fetchNext7Days(PRODUCT_IDS.NEXT_7_DAYS);
    });
  }

  // Function 3 - Runs daily
  static async scheduleFun3() {
    await globalTaskQueue.enqueue(async () => {
      log('Executing fetchNext30Days - Fetch Next 30 Days');
      await fetchNext30Days(PRODUCT_IDS.NEXT_30_DAYS);
    });
  }
}

// Express application setup
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/date-availabilities', dateAvailabilityRoutes)

// Routes
app.post("/pause", (req: any, res: any) => {
  if (isPaused) {
    return res.status(400).json({ message: "Task is already paused." });
  }
  isPaused = true;
  console.log("Task has been paused.");
  return res.status(200).json({ message: "Task has been paused successfully." });
});

app.post("/resume", (req: any, res: any) => {
  if (!isPaused) {
    return res.status(400).json({ message: "Task is being done" });
  }
  isPaused = false;
  console.log("Task has resumed.");
  return res.status(200).json({ message: "Task interval started" });
});

app.get('/', (req: any, res: any) => {
  res.send('Hello, TypeScript with Express!');
});

// Scheduler setup
function setupScheduler() {
  // Every 15 minutes
  cron.schedule('*/1 * * * *', () => {
    if(isPaused){ return; }
    ScheduledFunctions.scheduleFun1().catch(console.error);
  });

  // Every 4 hours
//   0 */4 * * *
  cron.schedule('0 */4 * * *', () => {
    if(isPaused){ return; }
    ScheduledFunctions.scheduleFun2().catch(console.error);
  });

  // Daily at midnight
  cron.schedule('0 0 * * *', () => {
    if(isPaused){ return; }
    ScheduledFunctions.scheduleFun3().catch(console.error);
  });
}

// Start the application
function startApplication() {
  // Setup schedulers
  setupScheduler();

  // Start Express server
  const server = app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
}

// Initialize the application
startApplication();

export { app, ScheduledFunctions };