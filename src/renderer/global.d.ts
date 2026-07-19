import { ArchivalCalendarApi } from '../main/preload';

declare global {
  interface Window {
    archivalCalendar: ArchivalCalendarApi;
  }
}

export {};
