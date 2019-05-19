import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import expressPerm from "express-jwt-permissions";
const guard = expressPerm();
// Assign router to the express.Router() instance
const router: Router = Router();


// Export the express.Router() instance to be used by server.ts
export const AlertsController: Router = router;
