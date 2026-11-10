import "mocha";
import { assert } from "chai";
import { mount, VueWrapper } from "@vue/test-utils";
import Vuex, { Store } from "vuex";

import { loadI18nMessages } from "../../../store/i18n";
import MenuPage from "../../../components/Popup/MenuPage.vue";

import { Style } from "../../../store/Style";
import { Accounts } from "../../../store/Accounts";
import { Backup } from "../../../store/Backup";
import { CurrentView } from "../../../store/CurrentView";
import { Menu } from "../../../store/Menu";
import { Notification } from "../../../store/Notification";
import { Qr } from "../../../store/Qr";

import chrome from "sinon-chrome";

mocha.setup("bdd");
let i18n: { [key: string]: string };

describe("MenuPage", () => {
  before(async () => {
    i18n = await loadI18nMessages();
  });

  const storeOpts = {
    menu: {
      state: {
        version: "1.2.3",
      },
      namespaced: true,
    },
  };

  let store: Store<{}>;

  let wrapper: VueWrapper<any>;

  before(() => {
    // mock the chrome global object
    global.chrome.tabs.create = chrome.tabs.create;
    global.chrome.storage.managed.get = chrome.storage.managed.get;
  });

  beforeEach(async () => {
    store = new Vuex.Store({
      modules: storeOpts,
    });
    wrapper = mount(MenuPage, {
      global: { plugins: [store], mocks: { i18n } },
    });
  });

  const clickMenuPageButtonByTitle = async (
    wrapper: VueWrapper<any>,
    title: string,
  ) => wrapper.find(`*[title='${title}']`).trigger("click");

  describe("feedback button", () => {
    // mocks the user agent for testing purposes
    const mockUserAgent = (userAgent: string) => {
      Object.defineProperty(global, "navigator", {
        value: {
          userAgent,
        },
        configurable: true,
        enumerable: true,
        writable: true,
      });
    };

    beforeEach(() => {
      wrapper = mount(MenuPage, {
        global: { plugins: [store], mocks: { i18n } },
      });
    });

    it("should open the project issue tracker when feedback is clicked in Chrome", async () => {
      mockUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      );
      await clickMenuPageButtonByTitle(wrapper, "Feedback");
      assert.ok(
        chrome.tabs.create.withArgs({
          url: "https://github.com/Authenticator-Extension/Authenticator/issues",
        }).called,
        "Tab create should be called with the project issue tracker URL",
      );
    });

    it("should open the project issue tracker when feedback is clicked in Edge", async () => {
      mockUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 Safari/537.36 Edg/79.0.309.43",
      );
      await clickMenuPageButtonByTitle(wrapper, "Feedback");
      assert.ok(
        chrome.tabs.create.withArgs({
          url: "https://github.com/Authenticator-Extension/Authenticator/issues",
        }).called,
        "Tab create should be called with the project issue tracker URL",
      );
    });

    it("should open the project issue tracker when feedback is clicked in Firefox", async () => {
      mockUserAgent(
        "Mozilla/5.0 (Windows NT x.y; rv:10.0) Gecko/20100101 Firefox/10.0",
      );
      await clickMenuPageButtonByTitle(wrapper, "Feedback");
      assert.ok(
        chrome.tabs.create.withArgs({
          url: "https://github.com/Authenticator-Extension/Authenticator/issues",
        }).called,
        "Tab create should be called with the project issue tracker URL",
      );
    });

    it("should open the project issue tracker for an unknown user agent", async () => {
      mockUserAgent("Unknown");
      await clickMenuPageButtonByTitle(wrapper, "Feedback");
      assert.ok(
        chrome.tabs.create.withArgs({
          url: "https://github.com/Authenticator-Extension/Authenticator/issues",
        }).called,
        "Tab create should be called with the project issue tracker URL",
      );
    });

    describe("feedbackURL is set", () => {
      beforeEach(async () => {
        try {
          chrome.storage.managed.get.yieldsAsync({
            feedbackURL: "https://authenticator.cc",
          });

          store = new Vuex.Store({
            modules: {
              backup: await new Backup().getModule(),
              currentView: new CurrentView().getModule(),
              notification: new Notification().getModule(),
              qr: new Qr().getModule(),
              style: new Style().getModule(),
              menu: await new Menu().getModule(),
              accounts: await new Accounts().getModule(),
            },
          });

          wrapper = mount(MenuPage, {
            global: { plugins: [store], mocks: { i18n } },
          });
        } catch (e) {
          console.error(e);
          // Doesn't show up in mocha?
          throw e;
        }
      });

      it("should open a new tab to the page specified in ManagedStorage", async () => {
        await clickMenuPageButtonByTitle(wrapper, "Feedback");
        assert.ok(
          chrome.tabs.create.withArgs({ url: "https://authenticator.cc" })
            .called,
          "Tab create should be called with the feedback URL",
        );
      });
    });
  });

  describe("extension version", () => {
    it("should be displayed", () => {
      assert.equal(wrapper.find("#version").text(), "Version 1.2.3");
    });
  });
});
