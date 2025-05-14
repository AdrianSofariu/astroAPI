const supabase = require("./supabase");

const MONITOR_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const TIME_WINDOW_MINUTES = 5;
const ACTION_THRESHOLD = 3;

async function monitorLogsForSuspiciousActivity() {
  const since = new Date(Date.now() - TIME_WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data: logs, error } = await supabase
    .from("logs")
    .select("user_id, action, timestamp")
    .gte("timestamp", since);

  if (error) {
    console.error("Error fetching logs:", error);
    return;
  }

  const activityCount = {};

  for (const log of logs) {
    activityCount[log.user_id] = (activityCount[log.user_id] || 0) + 1;
  }

  for (const [userId, count] of Object.entries(activityCount)) {
    if (count > ACTION_THRESHOLD) {

      // Check if already monitored
      const { data: existing, error: checkErr } = await supabase
        .from("monitored_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkErr) {
        console.error("Error checking monitored_users:", checkErr);
        continue;
      }

      if (!existing) {
        const { error: insertErr } = await supabase.from("monitored_users").insert([
          {
            user_id: userId,
            reason: `High activity (${count} actions in ${TIME_WINDOW_MINUTES} mins)`,
            flagged_at: new Date().toISOString(),
          },
        ]);

        if (insertErr) {
          console.error("Error inserting into monitored_users:", insertErr);
        } else {
          console.log(`User ${userId} added to monitored_users.`);
        }
      }
    }
  }
}

// Start background monitoring
setInterval(monitorLogsForSuspiciousActivity, MONITOR_INTERVAL_MS);
