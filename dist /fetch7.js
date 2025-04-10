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
exports.fetchNext7Days = fetchNext7Days;
const p_limit_1 = __importDefault(require("p-limit"));
const promises_1 = require("timers/promises");
const fetchStore_1 = require("./fetchStore");
function fetchNext7Days(products_1) {
    return __awaiter(this, arguments, void 0, function* (products, callsPerMinute = 30, concurrency = 1) {
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
        // delay 
        const delayMs = (60 * 1000) / callsPerMinute;
        // Create tasks
        const tasks = products.flatMap(productId => dates.map(date => ({ productId, date })));
        console.log(`Processing ${tasks.length} tasks with ${concurrency} concurrent workers at ${callsPerMinute} calls per minute`);
        // Create a concurrency limiter
        const limit = (0, p_limit_1.default)(concurrency);
        // Process tasks with concurrency control and simple rate limiting
        const promises = tasks.map(({ productId, date }) => {
            return limit(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Process the request
                    (0, fetchStore_1.fetchAndStoreInventory)(productId, date);
                    console.log(`Completed: Product ${productId} for ${date}`);
                    // rate limiting
                    yield (0, promises_1.setTimeout)(delayMs);
                }
                catch (error) {
                    console.error(`Error processing ${productId} for ${date}:`, error);
                }
            }));
        });
        yield Promise.all(promises);
    });
}
