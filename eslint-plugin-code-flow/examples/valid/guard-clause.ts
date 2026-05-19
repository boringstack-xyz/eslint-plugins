async function dispose(ref: { client: { quit(): Promise<void> } | null }): Promise<void> {
  if (ref.client === null) {
    return;
  }

  await ref.client.quit();
  ref.client = null;
}

export { dispose };
