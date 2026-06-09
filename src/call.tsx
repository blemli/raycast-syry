import { showHUD, showToast, Toast, LaunchProps } from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

const execFileAsync = promisify(execFile);

function normalizeNumber(raw: string): string {
  const trimmed = raw.trim().replace(/\(0\)/g, "");
  const cleaned = trimmed.replace(/[\s\-./]/g, "");
  if (cleaned.startsWith("+")) {
    return "+" + cleaned.slice(1).replace(/\D/g, "");
  }
  return cleaned.replace(/\D/g, "");
}

function resolveSyry(): string {
  const candidates = [
    `${homedir()}/.local/bin/syry`,
    "/opt/homebrew/bin/syry",
    "/usr/local/bin/syry",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "syry";
}

export default async function Command(props: LaunchProps<{ arguments: { number: string } }>) {
  const number = normalizeNumber(props.arguments.number ?? "");
  if (!number) {
    await showToast({ style: Toast.Style.Failure, title: "No valid number" });
    return;
  }

  try {
    await execFileAsync(resolveSyry(), ["call", number], {
      env: { ...process.env, PATH: `${process.env.PATH}:${homedir()}/.local/bin:/opt/homebrew/bin:/usr/local/bin` },
    });
    await showHUD(`📞 Calling ${number}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await showToast({ style: Toast.Style.Failure, title: "Call failed", message });
  }
}
