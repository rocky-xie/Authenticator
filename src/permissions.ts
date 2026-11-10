// Vue
import { createApp } from "vue";
import Vuex from "vuex";

// Components
import PermissionsView from "./components/Permissions.vue";
import CommonComponents from "./components/common/index";

// Other
import { loadI18nMessages } from "./store/i18n";
import { Permissions } from "./store/Permissions";

async function init() {
  const app = createApp(PermissionsView);
  app.config.globalProperties.i18n = await loadI18nMessages();
  for (const component of CommonComponents) {
    app.component(component.name, component.component);
  }

  // State
  const store = new Vuex.Store({
    modules: {
      permissions: await new Permissions().getModule(),
    },
  });

  const instance = app.use(store).mount("#permissions");

  // Set title
  try {
    document.title = instance.i18n.extName;
  } catch (e) {
    console.error(e);
  }
}

init();
