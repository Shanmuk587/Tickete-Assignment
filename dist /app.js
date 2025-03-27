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
exports.ScheduledFunctions = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const dateAvailabilityRoutes_1 = __importDefault(require("./routes/dateAvailabilityRoutes"));
const fetchtoday_1 = require("./fetchtoday");
const fetch30_1 = require("./fetch30");
const fetch7_1 = require("./fetch7");
let isPaused = false;
// Increase max listeners to prevent warnings
// EventEmitter.defaultMaxListeners = 20;
// Custom Queue Class for managing task processing
class TaskQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }
    enqueue(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.queue.push(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield task();
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                }));
                this.processQueue();
            });
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent concurrent processing
            if (this.isProcessing)
                return;
            this.isProcessing = true;
            while (this.queue.length > 0) {
                const task = this.queue.shift();
                if (task) {
                    try {
                        yield task();
                    }
                    catch (error) {
                        console.error('Task processing error:', error);
                    }
                }
            }
            this.isProcessing = false;
        });
    }
}
// Created a global task queue
const globalTaskQueue = new TaskQueue();
// Logging utility for debugging
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
    static scheduleFun1() {
        return __awaiter(this, void 0, void 0, function* () {
            yield globalTaskQueue.enqueue(() => __awaiter(this, void 0, void 0, function* () {
                log('Executing batchFetchInventory - Batch Fetch Inventory');
                yield (0, fetchtoday_1.batchFetchInventory)();
            }));
        });
    }
    // Function 2 - Runs every 4 hours
    static scheduleFun2() {
        return __awaiter(this, void 0, void 0, function* () {
            yield globalTaskQueue.enqueue(() => __awaiter(this, void 0, void 0, function* () {
                log('Executing fetchNext7Days - Fetch Next 7 Days');
                yield (0, fetch7_1.fetchNext7Days)(PRODUCT_IDS.NEXT_7_DAYS);
            }));
        });
    }
    // Function 3 - Runs daily
    static scheduleFun3() {
        return __awaiter(this, void 0, void 0, function* () {
            yield globalTaskQueue.enqueue(() => __awaiter(this, void 0, void 0, function* () {
                log('Executing fetchNext30Days - Fetch Next 30 Days');
                yield (0, fetch30_1.fetchNext30Days)(PRODUCT_IDS.NEXT_30_DAYS);
            }));
        });
    }
}
exports.ScheduledFunctions = ScheduledFunctions;
// Express application setup
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
app.use('/date-availabilities', dateAvailabilityRoutes_1.default);
// Routes
app.post("/pause", (req, res) => {
    if (isPaused) {
        return res.status(400).json({ message: "Task is already paused." });
    }
    isPaused = true;
    console.log("Task has been paused.");
    return res.status(200).json({ message: "Task has been paused successfully." });
});
app.post("/resume", (req, res) => {
    if (!isPaused) {
        return res.status(400).json({ message: "Task is being done" });
    }
    isPaused = false;
    console.log("Task has resumed.");
    return res.status(200).json({ message: "Task interval started" });
});
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
// Scheduler setup
function setupScheduler() {
    // Every 15 minutes
    node_cron_1.default.schedule('*/15 * * * *', () => {
        if (isPaused) {
            return;
        }
        ScheduledFunctions.scheduleFun1().catch(console.error);
    });
    // Every 4 hours
    //   0 */4 * * *
    node_cron_1.default.schedule('0 */4 * * *', () => {
        if (isPaused) {
            return;
        }
        ScheduledFunctions.scheduleFun2().catch(console.error);
    });
    // Daily at midnight
    node_cron_1.default.schedule('0 0 * * *', () => {
        if (isPaused) {
            return;
        }
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
