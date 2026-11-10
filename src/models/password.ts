import { BrowserStorage, isOldKey } from "./storage";

type ArgonRequest =
  | { action: "hash"; value: string; salt: string | Uint8Array }
  | { action: "verify"; value: string; hash: string };

async function requestArgon<T>(message: ArgonRequest): Promise<T> {
  const iframe = document.getElementById(
    "argon-sandbox",
  ) as HTMLIFrameElement | null;
  const target = iframe?.contentWindow;
  if (!target) {
    throw new Error("argon-sandbox missing!");
  }

  const requestId = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", receiveResponse);
      reject(new Error("Argon2 request timed out"));
    }, 30000);

    function receiveResponse(event: MessageEvent) {
      if (
        event.source !== target ||
        !event.data ||
        event.data.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener("message", receiveResponse);
      if (event.data.error) {
        reject(new Error("Argon2 operation failed"));
      } else {
        resolve(event.data.response as T);
      }
    }

    window.addEventListener("message", receiveResponse);
    target.postMessage({ ...message, requestId }, "*");
  });
}

export async function argonHash(value: string, salt: string): Promise<string> {
  return requestArgon<string>({
    action: "hash",
    value,
    salt,
  });
}

export async function argonVerify(
  value: string,
  hash: string,
): Promise<boolean> {
  return requestArgon<boolean>({
    action: "verify",
    value,
    hash,
  });
}

// Verify a password using keys in BrowserStorage
export async function verifyPasswordUsingKeyID(
  keyId: string,
  password: string,
): Promise<boolean> {
  // Get key for current encryption
  const keys = await BrowserStorage.getKeys();
  if (isOldKey(keys)) {
    throw new Error(
      "v3 encryption not being used with verifyPassword. This should never happen!",
    );
  }

  const key = keys.find((key) => key.id === keyId);
  if (!key) {
    throw new Error(`Key ${keyId} not in BrowserStorage`);
  }

  return verifyPasswordUsingKey(key, password);
}

export async function verifyPasswordUsingKey(
  key: Key,
  password: string,
): Promise<boolean> {
  // Hash password with argon
  const rawHash = await argonHash(password, key.salt);
  if (!rawHash) {
    throw new Error("argon2 did not return a hash!");
  }
  // https://passlib.readthedocs.io/en/stable/lib/passlib.hash.argon2.html#format-algorithm
  const possibleHash = rawHash.split("$")[5];

  // verify user password by comparing their password hash with the
  // hash of their password's hash
  return await argonVerify(possibleHash, key.hash);
}
