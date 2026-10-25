import type { SyncSender } from "./queue";

export const syntheticRemoteSend: SyncSender = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
};