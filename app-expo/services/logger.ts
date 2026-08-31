// Simple in-app logger — no screenshots needed
// Captures JS errors and shows Copy button
let logs: string[] = [];

export function log(msg: string) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logs.push(line);
  if (logs.length > 50) logs.shift();
  console.log(line);
}

export function getLogs() {
  return logs.join('\n');
}

export function captureGlobalErrors() {
  const prevHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((e: any, isFatal: boolean) => {
    log(`FATAL: ${e.message}\n${e.stack || ''}`);
    if (prevHandler) prevHandler(e, isFatal);
  });
  // also capture console.error
  const origError = console.error;
  console.error = (...args: any[]) => {
    log(`console.error: ${args.join(' ')}`);
    origError(...args);
  };
}
