"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3000;
let isPaused = false; // Variable to track the paused state
// Middleware
app.use(express_1.default.json());
const taskFunction = () => {
    console.log(`[${new Date().toISOString()}] Task is running...`);
};
setInterval(() => {
    if (!isPaused) {
        taskFunction();
    }
}, 5000);
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
app.post('/sdf', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
