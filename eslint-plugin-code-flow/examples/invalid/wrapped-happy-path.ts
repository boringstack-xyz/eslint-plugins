async function dispose(ref: { client: { quit(): Promise<void> } | null }): Promise<void> {
  if (ref.client !== null) {
    await ref.client.quit();
    ref.client = null;
  }
}

export { dispose };
