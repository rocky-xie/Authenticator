import "mocha";
import * as sinon from "sinon";
import { expect } from "chai";

import { mount } from "@vue/test-utils";
import Vuex, { Store } from "vuex";
import CommonComponents from "../../../components/common/index";

import EnterPasswordPage from "../../../components/Popup/EnterPasswordPage.vue";
import { loadI18nMessages } from "../../../store/i18n";

mocha.setup("bdd");
let i18n: { [key: string]: string };
const commonComponents = Object.fromEntries(
  CommonComponents.map((component) => [component.name, component.component]),
);

describe("EnterPasswordPage", () => {
  before(async () => {
    i18n = await loadI18nMessages();
  });

  const storeOpts = {
    modules: {
      accounts: {
        actions: {
          applyPassphrase: sinon.fake(),
        },
        state: {
          wrongPassword: false,
        },
        namespaced: true,
      },
    },
  };
  let store: Store<typeof storeOpts>;

  beforeEach(() => {
    // TODO: find a nicer var
    storeOpts.modules.accounts.actions.applyPassphrase.resetHistory();
    store = new Vuex.Store(storeOpts);
  });

  const mountPage = (attachTo?: Element) =>
    mount(EnterPasswordPage, {
      attachTo,
      global: {
        plugins: [store],
        mocks: { i18n },
        components: commonComponents,
      },
    });

  it("should apply password when button is clicked", async () => {
    const wrapper = mountPage();

    const passwordInput = wrapper.find("input");
    const passwordButton = wrapper.find("button");

    passwordInput.setValue("somePassword");
    await passwordButton.trigger("click");
    expect(
      storeOpts.modules.accounts.actions.applyPassphrase.calledWith(
        sinon.match.any,
        "somePassword",
      ),
    ).to.equal(true);
  });

  it("should apply password when enter is pressed", async () => {
    const wrapper = mountPage();

    const passwordInput = wrapper.find("input");

    passwordInput.setValue("anotherPassword");
    await passwordInput.trigger("keyup.enter");
    expect(
      storeOpts.modules.accounts.actions.applyPassphrase.calledWith(
        sinon.match.any,
        "anotherPassword",
      ),
    ).to.equal(true);
  });

  it("should autofocus password input", () => {
    const wrapper = mountPage(document.body);

    const passwordInput = wrapper.find("input");

    expect(passwordInput.element).to.equal(document.activeElement);
  });

  it("should not show incorrect password message", () => {
    const wrapper = mountPage();

    const errorText = wrapper.find("label.warning");

    expect(errorText.exists()).to.equal(false);
  });

  context("Incorrect password was entered", () => {
    before(() => {
      storeOpts.modules.accounts.state.wrongPassword = true;
    });

    it("should show incorrect password message", () => {
      const wrapper = mountPage();

      const errorText = wrapper.find("label.warning");

      expect(errorText.exists()).to.equal(true);
    });
  });
});
