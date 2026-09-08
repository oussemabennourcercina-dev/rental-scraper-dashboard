import { NodeSSH } from "node-ssh";

const VPS = {
  host: process.env.VPS_HOST ?? "37.187.39.209",
  username: process.env.VPS_USER ?? "root",
  password: process.env.VPS_PASSWORD,
  readyTimeout: 10000,
};

export async function sshExec(command: string): Promise<{ stdout: string; stderr: string }> {
  if (!VPS.password) throw new Error("VPS_PASSWORD not set");
  const ssh = new NodeSSH();
  try {
    await ssh.connect(VPS);
    const result = await ssh.execCommand(command);
    return result;
  } finally {
    ssh.dispose();
  }
}

export async function getServiceStatus(): Promise<"active" | "inactive" | "failed" | "unknown"> {
  if (!VPS.password) return "unknown";
  try {
    const { stdout } = await sshExec("pgrep -f scheduler.py > /dev/null && echo active || echo inactive");
    const s = stdout.trim();
    if (s === "active") return "active";
    if (s === "inactive") return "inactive";
    return "unknown";
  } catch {
    return "unknown";
  }
}