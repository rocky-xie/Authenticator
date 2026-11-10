import { createApp } from "vue";
import ImportView from "./components/Import.vue";
import CommonComponents from "./components/common/index";
import { loadI18nMessages } from "./store/i18n";

import { Encryption } from "./models/encryption";
import { EntryStorage } from "./models/storage";
import { getOTPAuthPerLineFromOPTAuthMigration } from "./models/migration";
import * as CryptoJS from "crypto-js";
import { argonHash, argonVerify } from "./models/password";
import { parseOTPAuthURI } from "./models/otpauth-uri";

async function init() {
  const app = createApp(ImportView);
  app.config.globalProperties.i18n = await loadI18nMessages();
  for (const component of CommonComponents) {
    app.component(component.name, component.component);
  }

  // Load entries to global
  const cachedSecrets = await getCachedSecrets();
  const encryption = new Encryption(
    cachedSecrets.cachedPassphrase,
    cachedSecrets.cachedKeyId,
  );
  const entries = await EntryStorage.get();

  if (encryption.getEncryptionStatus()) {
    for (const entry of entries) {
      await entry.applyEncryption(encryption);
    }
  }

  app.config.globalProperties.$entries = entries;
  app.config.globalProperties.$encryption = encryption;

  const instance = app.mount("#import");

  // Set title
  try {
    document.title = instance.i18n.extName;
  } catch (e) {
    console.error(e);
  }
}

init();

async function getCachedSecrets() {
  const { cachedPassphrase = "", cachedKeyId = "" } =
    (await chrome.storage.session.get(["cachedPassphrase", "cachedKeyId"])) as {
      cachedPassphrase?: string;
      cachedKeyId?: string;
    };

  return { cachedPassphrase, cachedKeyId };
}

export async function decryptBackupData(
  backupData: { [hash: string]: OTPStorage | Key },
  passphrase: string | null,
) {
  const decryptedBackupData: { [hash: string]: RawOTPStorage } = {};
  const keys: Map<string, string | null> = new Map();
  for (const hash in backupData) {
    const unknownStorageItem = backupData[hash];
    if (
      typeof unknownStorageItem !== "object" ||
      unknownStorageItem.dataType === "Key"
    ) {
      continue;
    }
    let storageItem: RawOTPStorage;
    if (unknownStorageItem.dataType === "EncOTPStorage") {
      if (!passphrase) {
        continue;
      }

      if (!keys.has(unknownStorageItem.keyId)) {
        keys.set(
          unknownStorageItem.keyId,
          await findAndUnlockKey(
            backupData,
            unknownStorageItem.keyId,
            passphrase,
          ),
        );
      }
      const decryptKey = keys.get(unknownStorageItem.keyId);
      if (!decryptKey) {
        // wrong password for key
        continue;
      }

      storageItem = {
        ...unknownStorageItem,
        ...JSON.parse(
          CryptoJS.AES.decrypt(unknownStorageItem.data, decryptKey).toString(
            CryptoJS.enc.Utf8,
          ),
        ),
        encrypted: false,
      };
    } else {
      storageItem = unknownStorageItem;
    }
    if (!storageItem.secret) {
      continue;
    }
    if (storageItem.encrypted && !passphrase) {
      continue;
    }
    if (storageItem.encrypted && passphrase) {
      try {
        storageItem.secret = CryptoJS.AES.decrypt(
          storageItem.secret,
          passphrase,
        ).toString(CryptoJS.enc.Utf8);
        storageItem.encrypted = false;
      } catch {
        continue;
      }
    }
    // storageItem.secret may be empty after decrypt with wrong
    // passphrase
    if (!storageItem.secret) {
      continue;
    }
    decryptedBackupData[hash] = storageItem;
  }
  return decryptedBackupData;
}

async function findAndUnlockKey(
  importData: { [key: string]: OTPStorage | Key },
  keyId: string,
  password: string,
): Promise<string | null> {
  if (!(keyId in importData)) {
    return null;
  }

  const key = importData[keyId];
  if (key.dataType !== "Key" || key.id !== keyId) {
    return null;
  }

  const rawHash = await argonHash(password, key.salt);

  // https://passlib.readthedocs.io/en/stable/lib/passlib.hash.argon2.html#format-algorithm
  const possibleHash = rawHash.split("$")[5];
  if (!possibleHash) {
    throw new Error("argon2 did not return a hash!");
  }

  // verify user password by comparing their password hash with the
  // hash of their password's hash
  const isCorrectPassword = await argonVerify(possibleHash, key.hash);

  if (!isCorrectPassword) {
    return null;
  }

  return possibleHash;
}

export async function getEntryDataFromOTPAuthPerLine(importCode: string) {
  const lines = importCode.split("\n");
  const exportData: { [hash: string]: RawOTPStorage } = {};
  let failedCount = 0;
  let succeededCount = 0;
  for (let item of lines) {
    item = item.trim();
    if (item.startsWith("otpauth-migration:")) {
      const migrationData = getOTPAuthPerLineFromOPTAuthMigration(item);
      for (const line of migrationData) {
        lines.push(line);
      }
      continue;
    }
    if (!item.startsWith("otpauth:")) {
      continue;
    }

    const parsed = parseOTPAuthURI(item);
    if (!parsed) {
      failedCount++;
      continue;
    } else {
      const { account, algorithm, counter, digits, issuer, period, secret } =
        parsed;
      const type = parsed.type;
      {
        const hash = crypto.randomUUID();
        exportData[hash] = {
          account,
          hash,
          issuer,
          secret,
          type,
          encrypted: false,
          index: 0,
          counter,
          pinned: false,
        };
        if (period) {
          exportData[hash].period = period;
        }
        if (digits) {
          exportData[hash].digits = digits;
        }
        if (algorithm) {
          exportData[hash].algorithm = algorithm;
        }

        succeededCount++;
      }
    }
  }

  return { exportData, failedCount, succeededCount };
}
