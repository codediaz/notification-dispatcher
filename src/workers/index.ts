// Worker scaffolding for background jobs.
// Workers process queued notification tasks (e.g., send WhatsApp message, send email).
// Implement concrete workers inside this directory as channels are added.

export async function startWorkers(): Promise<void> {
  console.log('Workers started (no-op in scaffold)');
}

export async function stopWorkers(): Promise<void> {
  console.log('Workers stopped (no-op in scaffold)');
}
