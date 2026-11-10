import { argon2id, argon2Verify } from "hash-wasm";

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) {
    return;
  }

  const message = event.data;
  const source = event.source as Window;

  if (
    !source ||
    !message ||
    typeof message !== "object" ||
    typeof message.requestId !== "string" ||
    typeof message.value !== "string" ||
    message.value.length > 1024 * 1024
  ) {
    return;
  }

  switch (message.action) {
    case "hash":
      if (
        (typeof message.salt !== "string" &&
          !(message.salt instanceof Uint8Array)) ||
        message.salt.length > 1024
      ) {
        return;
      }
      Argon.hash(message.value, message.salt)
        .then((hash) => {
          source.postMessage(
            { requestId: message.requestId, response: hash },
            "*",
          );
        })
        .catch(() => {
          source.postMessage(
            { requestId: message.requestId, error: "argon_hash_failed" },
            "*",
          );
        });
      break;

    case "verify":
      if (typeof message.hash !== "string" || message.hash.length > 4096) {
        return;
      }
      Argon.compareHash(message.hash, message.value)
        .then((result) => {
          source.postMessage(
            { requestId: message.requestId, response: result },
            "*",
          );
        })
        .catch(() => {
          source.postMessage(
            { requestId: message.requestId, error: "argon_verify_failed" },
            "*",
          );
        });
      break;

    default:
      break;
  }
  return;
});

class Argon {
  static async hash(value: string, salt: string | Uint8Array) {
    return argon2id({
      password: value,
      salt,
      iterations: 2,
      memorySize: 1024 * 19,
      parallelism: 1,
      hashLength: 32,
      outputType: "encoded",
    });
  }

  static async compareHash(hash: string, value: string) {
    try {
      return await argon2Verify({ password: value, hash });
    } catch {
      return false;
    }
  }
}
