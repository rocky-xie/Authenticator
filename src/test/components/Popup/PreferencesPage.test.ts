import "mocha";
import { expect } from "chai";
import { mount } from "@vue/test-utils";
import Vuex from "vuex";
import chrome from "sinon-chrome";

import PreferencesPage from "../../../components/Popup/PreferencesPage.vue";
import CommonComponents from "../../../components/common/index";

const commonComponents = Object.fromEntries(
  CommonComponents.map((component) => [component.name, component.component]),
);

describe("PreferencesPage", () => {
  beforeEach(() => {
    global.chrome.runtime.sendMessage = chrome.runtime.sendMessage;
    global.chrome.permissions.request = chrome.permissions.request;
    global.chrome.storage.local.get = chrome.storage.local.get;
    global.chrome.storage.sync.get = chrome.storage.sync.get;
    chrome.storage.local.get.resolves({ UserSettings: {} });
    chrome.storage.sync.get.resolves({ UserSettings: {} });
    chrome.runtime.sendMessage.resolves(true);
  });

  it("enables smart autofill without opening a permission prompt", async () => {
    const store = new Vuex.Store({
      modules: {
        menu: {
          namespaced: true,
          state: {
            smartAutofill: false,
            zoom: 100,
            useAutofill: false,
            smartFilter: false,
            enableContextMenu: false,
            theme: "normal",
            autolock: 30,
            storageArea: "local",
          },
          mutations: {
            setSmartAutofill(state, enabled: boolean) {
              state.smartAutofill = enabled;
            },
          },
        },
        accounts: {
          namespaced: true,
          state: { defaultEncryption: "" },
        },
      },
    });

    const wrapper = mount(PreferencesPage, {
      global: {
        plugins: [store],
        components: commonComponents,
        mocks: { i18n: {} },
      },
    });

    await wrapper.vm.configureSmartAutofill(true);

    expect(
      (store.state as { menu: { smartAutofill: boolean } }).menu.smartAutofill,
    ).to.equal(true);
    expect(chrome.permissions.request.called).to.equal(false);
    expect(
      chrome.runtime.sendMessage.calledWith({
        action: "configureSmartAutofill",
        enabled: true,
      }),
    ).to.equal(true);
  });
});
