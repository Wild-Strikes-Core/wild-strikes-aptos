// src/config/middleware.ts

import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

export function registerMiddlewares(app: Express) {
  // Enable CORS for all routes
  app.use(cors()); // allows yung frontend na ma-access yung backend

  // Use Helmet for security headers (disabled CSP for testing)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for testing
  }));

  // Use Morgan for logging HTTP requests
  app.use(morgan('dev')); // logs HTTP requests in development format
                          // ex. GET /api/player 200 12ms

  // Parse JSON bodies
  app.use(express.json());

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
}