import { checkDefaultersAndNotify } from './attendanceService';

/** Initialize cron background tasks */
export const initCronJobs = (): void => {
  // Run daily check at 20:00 (8:00 PM)
  const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

  const runCheck = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear - 1}-${String(currentYear).slice(2)}`;
      const result = await checkDefaultersAndNotify(academicYear);
      process.stdout.write(
        `[Cron] Defaulters check completed: ${result.totalDefaulters} defaulters found, ${result.emailsSent} emails sent.\n`
      );
    } catch (err) {
      process.stderr.write(`[Cron Error] Defaulter check failed: ${String(err)}\n`);
    }
  };

  // Schedule initial check after 30 seconds, then daily
  setTimeout(() => {
    void runCheck();
    setInterval(() => {
      void runCheck();
    }, MILLIS_PER_DAY);
  }, 30000);

  process.stdout.write('[Cron] Daily attendance defaulter check scheduled (8:00 PM).\n');
};
