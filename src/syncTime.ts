import { UserSettings } from "./models/settings";

export async function syncTimeWithGoogle() {
  await UserSettings.updateItems();

  return new Promise(
    (resolve: (value: string) => void, reject: (reason: Error) => void) => {
      try {
        // @ts-expect-error - these typings are wrong
        const xhr = new XMLHttpRequest({ mozAnon: true });
        xhr.open("HEAD", "https://www.google.com/generate_204");
        const xhrAbort = setTimeout(() => {
          xhr.abort();
          return resolve("updateFailure");
        }, 5000);
        const requestStartedAt = Date.now();
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            clearTimeout(xhrAbort);
            const date = xhr.getResponseHeader("date");
            if (!date) {
              return resolve("updateFailure");
            }
            const serverTime = new Date(date).getTime();
            // Estimate the local time at the response midpoint so network
            // latency does not become part of the saved correction.
            const clientTime = (requestStartedAt + Date.now()) / 2;
            const offset = Math.round((serverTime - clientTime) / 1000);

            if (Math.abs(offset) <= 300) {
              // within 5 minutes
              UserSettings.items.offset = offset;
              UserSettings.items.offsetUpdatedAt = Date.now();
              UserSettings.commitItems();
              return resolve("updateSuccess");
            } else {
              return resolve("clock_too_far_off");
            }
          }
        };
        xhr.send();
      } catch (error) {
        return reject(error as Error);
      }
    },
  );
}
