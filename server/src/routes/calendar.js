import { Router } from "express";
import * as calendarService from "../services/calendar.js";

export const calendarRouter = Router();

calendarRouter.get("/", async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1; // 1-12
  res.json(await calendarService.getCalendarMonth(year, month));
});

calendarRouter.get("/upcoming", async (req, res) => {
  const windowDays = Number(req.query.days) || 7;
  res.json(await calendarService.getUpcoming(windowDays));
});
