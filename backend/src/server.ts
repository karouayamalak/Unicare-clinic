import app from "./app";
import { env, connectDB, closeDB } from "./config";

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  await connectDB();

  const basePort = env.PORT;
  let portToTry = basePort;

  while (true) {
    try {
      server = await new Promise<ReturnType<typeof app.listen>>(
        (resolve, reject) => {
          const candidate = app.listen(portToTry, () => resolve(candidate));
          candidate.on("error", reject);
        },
      );

      console.log(
        ` Server running in ${env.NODE_ENV} mode on port ${portToTry}`,
      );

      if (portToTry !== basePort) {
        console.warn(
          ` API is on port ${portToTry} (not ${basePort}). Update your frontend proxy.`,
        );
      }
      break;
    } catch (err: any) {
      if (err.code === "EADDRINUSE" && portToTry < basePort + 10) {
        console.warn(` Port ${portToTry} is busy. Trying ${portToTry + 1}...`);
        portToTry += 1;
        continue;
      }

      console.error(" Failed to start server:", err);
      process.exit(1);
    }
  }

  process.on("unhandledRejection", (err: Error) => {
    console.error(" UNHANDLED REJECTION! Shutting down...");
    console.error(err);
    if (server) {
      server.close(() => {
        closeDB().then(() => process.exit(1));
      });
    } else {
      process.exit(1);
    }
  });
};

process.on("uncaughtException", (err: Error) => {
  console.error(" UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err);
  process.exit(1);
});

const gracefulShutdown = (signal: string) => {
  console.warn(` ${signal} received. Closing HTTP server and database...`);
  if (server) {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();