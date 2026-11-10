interface SmartAutofillCandidate {
  hash: string;
  label: string;
}

interface SmartAutofillResponse {
  candidates?: SmartAutofillCandidate[];
  code?: string;
  error?: "disabled" | "locked" | "missing";
}

const marker = "__authenticatorSmartAutofillV1__";
const markedWindow = window as typeof window & {
  __authenticatorSmartAutofillV1__?: boolean;
};

if (!markedWindow[marker]) {
  markedWindow[marker] = true;
  void initialize();
}

async function initialize() {
  let enabled = await isEnabled();
  let observer: MutationObserver | undefined;
  let scanTimer: number | undefined;
  const controls = new Map<
    HTMLInputElement,
    { host: HTMLDivElement; button: HTMLButtonElement; shadow: ShadowRoot }
  >();

  const removeControls = () => {
    controls.forEach(({ host }) => host.remove());
    controls.clear();
  };

  const positionControls = () => {
    controls.forEach(({ host }, input) => {
      if (!input.isConnected || !isVisible(input)) {
        host.style.display = "none";
        return;
      }
      const rect = input.getBoundingClientRect();
      host.style.display = "block";
      host.style.left = `${Math.min(rect.right + 6, window.innerWidth - 32)}px`;
      host.style.top = `${rect.top + Math.max(0, (rect.height - 26) / 2)}px`;
    });
  };

  const scan = () => {
    scanTimer = undefined;
    if (!enabled) {
      return;
    }
    document.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      if (isOtpInput(input) && !controls.has(input)) {
        controls.set(input, createControl(input));
      }
    });
    controls.forEach(({ host }, input) => {
      if (!input.isConnected || !isOtpInput(input)) {
        host.remove();
        controls.delete(input);
      }
    });
    positionControls();
  };

  const scheduleScan = () => {
    if (scanTimer === undefined) {
      scanTimer = window.setTimeout(scan, 100);
    }
  };

  const start = () => {
    if (observer) {
      return;
    }
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "aria-label",
        "autocomplete",
        "disabled",
        "hidden",
        "id",
        "maxlength",
        "name",
        "placeholder",
        "style",
        "type",
      ],
    });
    scan();
  };

  const stop = () => {
    observer?.disconnect();
    observer = undefined;
    removeControls();
  };

  if (enabled) {
    start();
  }

  chrome.storage.onChanged.addListener(async (changes) => {
    if (!changes.UserSettings) {
      return;
    }
    enabled = await isEnabled();
    if (enabled) {
      start();
    } else {
      stop();
    }
  });

  window.addEventListener("resize", positionControls, { passive: true });
  window.addEventListener("scroll", positionControls, {
    capture: true,
    passive: true,
  });
}

async function isEnabled() {
  const [local, sync] = await Promise.all([
    chrome.storage.local.get("UserSettings"),
    chrome.storage.sync.get("UserSettings"),
  ]);
  const localSettings = (local.UserSettings || {}) as {
    storageLocation?: string;
    smartAutofill?: boolean;
  };
  const syncSettings = (sync.UserSettings || {}) as {
    smartAutofill?: boolean;
  };
  const settings =
    localSettings.storageLocation === "sync"
      ? { ...syncSettings, ...localSettings }
      : localSettings;
  return settings.smartAutofill === true;
}

function isOtpInput(input: HTMLInputElement) {
  if (
    input.disabled ||
    input.readOnly ||
    input.type === "hidden" ||
    input.type === "password" ||
    !["text", "tel", "number"].includes(input.type)
  ) {
    return false;
  }

  const label = input.labels
    ? Array.from(input.labels)
        .map((item) => item.textContent || "")
        .join(" ")
    : "";
  const identity = [
    input.id,
    input.name,
    input.placeholder,
    input.getAttribute("aria-label") || "",
    input.getAttribute("data-testid") || "",
    label,
  ]
    .join(" ")
    .toLowerCase();

  if (input.autocomplete === "one-time-code") {
    return true;
  }

  const otpIdentity =
    /(^|[^a-z])(otp|totp|otc|mfa|2fa)([^a-z]|$)|one.?time|verification.?code|security.?code|authenticator.?code|passcode|动态码|验证码|认证码|安全代码|一次性密码|ワンタイム|認証コード|인증.?코드/;
  if (!otpIdentity.test(identity)) {
    return false;
  }

  const expectedLength = input.maxLength;
  return (
    expectedLength === -1 ||
    expectedLength === 0 ||
    expectedLength === 6 ||
    expectedLength === 8
  );
}

function isVisible(input: HTMLInputElement) {
  const rect = input.getBoundingClientRect();
  const style = window.getComputedStyle(input);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function createControl(input: HTMLInputElement) {
  const host = document.createElement("div");
  host.setAttribute("data-authenticator-smart-autofill", "");
  host.style.cssText =
    "all:initial;position:fixed;width:26px;height:26px;z-index:2147483646;display:none";
  const shadow = host.attachShadow({ mode: "closed" });
  const button = document.createElement("button");
  button.type = "button";
  button.title =
    chrome.i18n.getMessage("smart_autofill_button") || "Authenticator";
  button.setAttribute("aria-label", button.title);
  button.style.cssText =
    "all:initial;box-sizing:border-box;width:26px;height:26px;border:1px solid #8a8a8a;border-radius:6px;background:#fff;box-shadow:0 1px 4px #0003;cursor:pointer;display:grid;place-items:center";
  button.appendChild(createAuthenticatorIcon());
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenus(shadow);
    const response = await sendMessage<SmartAutofillResponse>({
      action: "getSmartAutofillCandidates",
    });
    const candidates = response?.candidates || [];
    if (response?.error) {
      showStatus(shadow, response.error === "locked" ? "🔒" : "!");
      return;
    }
    if (candidates.length === 1) {
      await fillCandidate(input, candidates[0].hash, shadow);
      return;
    }
    if (candidates.length > 1) {
      showCandidateMenu(input, shadow, candidates);
      return;
    }
    showStatus(shadow, "—");
  });
  shadow.appendChild(button);
  document.documentElement.appendChild(host);
  return { host, button, shadow };
}

function createAuthenticatorIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", "#246fce");
  const key = document.createElementNS("http://www.w3.org/2000/svg", "path");
  key.setAttribute("fill", "white");
  key.setAttribute(
    "d",
    "M10.7 13.3a4 4 0 1 1 1.4-1.4L18 17.8V20h-2.2v-1.3h-1.7v-1.6h-1.6L10.7 15v-1.7ZM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  );
  svg.append(circle, key);
  return svg;
}

function showCandidateMenu(
  input: HTMLInputElement,
  shadow: ShadowRoot,
  candidates: SmartAutofillCandidate[],
) {
  const menu = document.createElement("div");
  menu.dataset.authenticatorMenu = "true";
  menu.style.cssText =
    "all:initial;position:absolute;right:0;top:30px;width:240px;max-height:240px;overflow:auto;padding:4px;border:1px solid #aaa;border-radius:7px;background:#fff;box-shadow:0 4px 16px #0004;font:13px system-ui,sans-serif;color:#222";
  candidates.forEach((candidate) => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = candidate.label;
    item.style.cssText =
      "all:initial;box-sizing:border-box;display:block;width:100%;padding:8px;border-radius:4px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:13px system-ui,sans-serif;color:#222";
    item.addEventListener(
      "mouseenter",
      () => (item.style.background = "#eaf2fd"),
    );
    item.addEventListener(
      "mouseleave",
      () => (item.style.background = "transparent"),
    );
    item.addEventListener("mousedown", (event) => event.preventDefault());
    item.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      menu.remove();
      await fillCandidate(input, candidate.hash, shadow);
    });
    menu.appendChild(item);
  });
  shadow.appendChild(menu);
}

async function fillCandidate(
  input: HTMLInputElement,
  hash: string,
  shadow: ShadowRoot,
) {
  const response = await sendMessage<SmartAutofillResponse>({
    action: "getSmartAutofillCode",
    hash,
  });
  if (!response?.code || !/^\d{6,8}$/.test(response.code)) {
    showStatus(shadow, response?.error === "locked" ? "🔒" : "!");
    return;
  }
  setInputValue(input, response.code);
  input.focus();
  showStatus(shadow, "✓");
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  if (!setter) {
    input.value = value;
  }
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  // Deliberately do not dispatch Enter, click a submit control, or submit the
  // surrounding form. The user always remains in control of submission.
}

function closeMenus(shadow: ShadowRoot) {
  shadow
    .querySelectorAll("[data-authenticator-menu]")
    .forEach((node) => node.remove());
}

function showStatus(shadow: ShadowRoot, text: string) {
  closeMenus(shadow);
  const status = document.createElement("span");
  status.dataset.authenticatorMenu = "true";
  status.textContent = text;
  status.style.cssText =
    "all:initial;position:absolute;left:4px;top:3px;width:18px;height:18px;border-radius:9px;background:#fff;display:grid;place-items:center;font:700 13px system-ui;color:#16713c;pointer-events:none";
  shadow.appendChild(status);
  window.setTimeout(() => status.remove(), 1200);
}

function sendMessage<T>(
  message: Record<string, unknown>,
): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve(undefined);
        return;
      }
      resolve(response as T);
    });
  });
}
