let streamingActive = false;

export function setContractEventStreamingActive(active: boolean): void {
  streamingActive = active;
}

export function isContractEventStreamingActive(): boolean {
  return streamingActive;
}
