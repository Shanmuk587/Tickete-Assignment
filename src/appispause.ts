import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

let isPaused: boolean = false; // Variable to track the paused state

// Middleware
app.use(express.json());

const taskFunction = () => {
    console.log(`[${new Date().toISOString()}] Task is running...`);
};

setInterval(() => {
    if (!isPaused) {
      taskFunction();
    }
  }, 5000);

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

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

app.post('/sdf', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
