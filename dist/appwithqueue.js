"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledFunctions = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const events_1 = require("events");
const node_cron_1 = __importDefault(require("node-cron"));
const dateAvailabilityRoutes_1 = __importDefault(require("./routes/dateAvailabilityRoutes"));
// Import existing functions
const fetchtoday_1 = require("./fetchtoday");
const fetch30_1 = require("./fetch30");
const fetch7_1 = require("./fetch7");
// Increase max listeners to prevent warnings
events_1.EventEmitter.defaultMaxListeners = 20;
// Custom Queue Class for managing task processing
class TaskQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }
    async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    await task();
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    async processQueue() {
        // Prevent concurrent processing
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    await task();
                }
                catch (error) {
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
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}
// Configuration for product IDs
const PRODUCT_IDS = {
    NEXT_7_DAYS: [14, 15], // Example product IDs
    NEXT_30_DAYS: [14, 15]
};
// Wrapper functions for existing tasks
class ScheduledFunctions {
    // Function 1 - Runs every 15 minutes
    static async scheduleFun1() {
        await globalTaskQueue.enqueue(async () => {
            log('Executing batchFetchInventory - Batch Fetch Inventory');
            await (0, fetchtoday_1.batchFetchInventory)();
        });
    }
    // Function 2 - Runs every 4 hours
    static async scheduleFun2() {
        await globalTaskQueue.enqueue(async () => {
            log('Executing fetchNext7Days - Fetch Next 7 Days');
            await (0, fetch7_1.fetchNext7Days)(PRODUCT_IDS.NEXT_7_DAYS);
        });
    }
    // Function 3 - Runs daily
    static async scheduleFun3() {
        await globalTaskQueue.enqueue(async () => {
            log('Executing fetchNext30Days - Fetch Next 30 Days');
            await (0, fetch30_1.fetchNext30Days)(PRODUCT_IDS.NEXT_30_DAYS);
        });
    }
}
exports.ScheduledFunctions = ScheduledFunctions;
// Express application setup
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
app.use('/date-availabilities', dateAvailabilityRoutes_1.default);
// Scheduler setup
function setupScheduler() {
    // Every 15 minutes
    node_cron_1.default.schedule('*/1 * * * *', () => {
        ScheduledFunctions.scheduleFun1().catch(console.error);
    });
    // Every 4 hours
    //   0 */4 * * *
    node_cron_1.default.schedule('0 */4 * * *', () => {
        ScheduledFunctions.scheduleFun2().catch(console.error);
    });
    // Daily at midnight
    node_cron_1.default.schedule('0 0 * * *', () => {
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
