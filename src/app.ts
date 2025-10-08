import express, { Application, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import userRoute from "./routes/userRoutes";
import adminRoute from "./routes/adminRoutes";
// import passportRoute from "./auth/authRoutes";
import { connectRedis } from "./config/redis";
import session from "express-session";
import passport from "passport";
import cron from "node-cron";
import { SquareOffService } from "./services/squareOffService";
// import { newOrderRepository } from "./repositories/newOrder";
import { fetchStockRepository } from "./repositories/fetchStock";
import { getOrderMatchingService } from "./dependencyInjection";
import morgan from "morgan";
import { createStream } from "rotating-file-stream";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { io } from "./server";
dotenv.config();
const app: Application = express();
connectDB();
connectRedis();
// const newOrderRepostory = new newOrderRepository();
const fetchStocks = new fetchStockRepository();
const squareOffService = new SquareOffService();
// Log directory
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  const logDirectory = path.join(__dirname, "logs");
  console.log(logDirectory);

  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const accessLogStream = createStream("access.log", {
    interval: "7d",
    path: logDirectory,
    maxFiles: 5,
  });

  app.use(
    morgan("combined", {
      stream: accessLogStream,
    })
  );
}

console.log("Rotating log stream configured.");

// Middleware for session management
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api", userRoute);
app.use("/api", adminRoute);
// app.use("/api", passportRoute);

app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) return next();
  res.status(404).send("Not Found");
});
cron.schedule("* * * * *", async () => {
  console.log("Running order matching...");
  try {
    await getOrderMatchingService().matchOrders();
    console.log("Order matching completed.");
  } catch (error) {
    console.error("Error while matching orders:", error);
  }
});
cron.schedule("* * * * *", async () => {
  console.log("Sending live portfolio summary...");
  const stockSymbols = ["AAPL", "GOOGL", "MSFT", "AMZN"];

  try {
    const updatedSummary = await fetchStocks.fetchStockData(stockSymbols);
    io.emit("portfolioSummaryUpdate", updatedSummary); // Broadcast the summary to all connected clients
  } catch (error) {
    console.error("Error fetching live stock data:", error);
  }
});
cron.schedule("15 15 * * *", async () => {
  console.log("Executing auto square off...");
  await squareOffService.autoSquareOff();
});

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("API is running..");
});

export default app;
