// Rebuilds 815live once a day at about 4:05 AM Chicago by POSTing the Pages
// production deploy hook (secret DEPLOY_HOOK_URL). Two UTC crons cover CDT and
// CST; whichever one isn't 4 AM in Chicago does nothing.

const chicagoHour = (date) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hourCycle: 'h23' }).format(date));

export default {
  async scheduled(controller, env) {
    const at = new Date(controller.scheduledTime);
    if (chicagoHour(at) !== 4) {
      console.log(`skipped: ${at.toISOString()} is not 4 AM in Chicago`);
      return;
    }
    if (!env.DEPLOY_HOOK_URL) throw new Error('DEPLOY_HOOK_URL secret is not set');
    const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    // Throwing marks the cron run as failed in the Worker's logs.
    if (!res.ok) throw new Error(`deploy hook returned HTTP ${res.status}`);
    console.log(`deploy hook accepted (${res.status}) for ${at.toISOString()}`);
  },
};
