import { useCallback, useState } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import ExpoAndroidUsagestats, {
  getAggregatedUsageStats,
  UsageStatsIntervalType,
  type UsageStats,
} from "expo-android-usagestats";

type Row = {
  packageName: string;
  totalTimeInForeground: number;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isHomeOrSystemUi(packageName: string) {
  const pkg = packageName.toLowerCase();
  return (
    pkg === "com.android.systemui" ||
    pkg.includes("nexuslauncher") ||
    pkg.includes("launcher3") ||
    pkg.endsWith(".launcher")
  );
}

function uniqueByPackage(stats: UsageStats[]) {
  const byPackage = new Map<string, UsageStats>();
  for (const s of stats) {
    const prev = byPackage.get(s.packageName);
    if (!prev || s.lastTimeStamp > prev.lastTimeStamp) {
      byPackage.set(s.packageName, s);
    }
  }
  return [...byPackage.values()];
}

function formatMs(ms: number) {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatScreenTime(ms: number) {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min screen time`;
  if (m === 0) return `${h} hr${h === 1 ? "" : "s"} screen time`;
  return `${h} hr${h === 1 ? "" : "s"} and ${m} min screen time`;
}

function toJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(e);
  }
}

export default function AppStats() {
  const [status, setStatus] = useState("Tap load");
  const [rows, setRows] = useState<Row[]>([]);
  const [totalMs, setTotalMs] = useState(0);
  const [dump, setDump] = useState("");
  const load = useCallback(async () => {
    if (Platform.OS !== "android") {
      setStatus("Android only");
      return;
    }

    try {
      const allowed = await ExpoAndroidUsagestats.hasUsageStatsPermission();
      if (!allowed) {
        setStatus(
          "Usage access is off. Tap Grant, enable lockin2, come back, tap Load.",
        );
        setRows([]);
        setTotalMs(0);
        setDump("");
        return;
      }

      const start = startOfToday();
      const end = Date.now();
      const stats = await getAggregatedUsageStats(
        start,
        end,
        UsageStatsIntervalType.INTERVAL_DAILY,
      );

      const fetchDump = toJson({
        start,
        end,
        startIso: new Date(start).toISOString(),
        endIso: new Date(end).toISOString(),
        isArray: Array.isArray(stats),
        count: Array.isArray(stats) ? stats.length : null,
        stats,
      });
      console.log("[app-stats] fetch JSON\n" + fetchDump);
      if (Array.isArray(stats)) {
        for (const s of stats) {
          console.log(
            `[app-stats] ${s.packageName} fg=${s.totalTimeInForeground} lastUsed=${s.lastTimeUsed} lastStamp=${s.lastTimeStamp}`,
          );
        }
      }

      const todayOnly = stats.filter((s) => s.lastTimeStamp >= start);
      const unique = uniqueByPackage(todayOnly);

      const launcherPackages = new Set(
        await ExpoAndroidUsagestats.getInstalledApps(),
      );
      const userApps = unique.filter(
        (s) =>
          s.totalTimeInForeground > 0 &&
          !isHomeOrSystemUi(s.packageName) &&
          (launcherPackages.size === 0 || launcherPackages.has(s.packageName)),
      );

      const next = [...userApps]
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
        .map((s) => ({
          packageName: s.packageName,
          totalTimeInForeground: s.totalTimeInForeground,
        }));

      const total = next.reduce(
        (sum, row) => sum + row.totalTimeInForeground,
        0,
      );

      const filteredDump = toJson({
        todayOnly: todayOnly.length,
        unique: unique.length,
        launcherPackages: launcherPackages.size,
        userApps: userApps.length,
        totalMs: total,
        totalLabel: formatScreenTime(total),
        next,
      });
      console.log("[app-stats] filtered JSON\n" + filteredDump);

      setRows(next);
      setStatus(`${next.length} apps since midnight`);
      setTotalMs(total);
      setDump(fetchDump + "\n\n" + filteredDump);
    } catch (e) {
      console.error("[app-stats] load failed", e);
      setStatus(String(e));
      setRows([]);
      setTotalMs(0);
      setDump(String(e));
    }
  }, []);

  const grant = useCallback(async () => {
    await ExpoAndroidUsagestats.requestUsageStatsPermission();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>App usage (today)</Text>
      <Text>{formatScreenTime(totalMs)}</Text>
      <Text style={styles.status}>{status}</Text>
      <Button title="Grant usage access" onPress={grant} />
      <View style={{ height: 8 }} />
      <Button title="Load stats" onPress={load} />
      {rows.map((row, index) => (
        <Text key={`${row.packageName}-${index}`} style={styles.row}>
          {formatMs(row.totalTimeInForeground)} {row.packageName}
        </Text>
      ))}
      {dump ? (
        <Text selectable style={styles.dump}>
          {dump}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "600" },
  status: { marginVertical: 8 },
  row: { fontFamily: Platform.select({ android: "monospace" }), marginTop: 6 },
  dump: {
    marginTop: 16,
    fontSize: 11,
    fontFamily: Platform.select({ android: "monospace" }),
  },
});
