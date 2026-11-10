import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

dotenv.config();

const app = express();

// ✅ Safe DB connection (for Vercel)
let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) return;
  try {
    await connectDB();
    isConnected = true;
    console.log("✅ DB Connected");
  } catch (err) {
    console.error("❌ DB ERROR:", err);
    throw err;
  }
};

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.CLIENT_URL,'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Ensure DB before every request
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import departmentRoutes from "./routes/departments.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leaves.js";
import assetRoutes from "./routes/assets.js";
import performanceRoutes from "./routes/performance.js";
import salaryRoutes from "./routes/salary.js";
import dashboardRoutes from "./routes/dashboard.js";

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/departments", departmentRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/leaves", leaveRoutes);
app.use("/assets", assetRoutes);
app.use("/performance", performanceRoutes);
app.use("/salary", salaryRoutes);
app.use("/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "Server running" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
