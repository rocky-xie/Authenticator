<template>
  <div id="permissions" class="theme-normal">
    <h1>{{ i18n.permissions }}</h1>
    <section class="permission-card">
      <h2>{{ i18n.smart_autofill_site_access }}</h2>
      <p>{{ i18n.smart_autofill_site_access_description }}</p>
      <button v-if="!smartAutofillAllSites" @click="grantSmartAutofillSites()">
        {{ i18n.permission_grant }}
      </button>
      <button v-else @click="revokeSmartAutofillSites()">
        {{ i18n.permission_revoke }}
      </button>
      <p class="permission-status">
        {{
          smartAutofillAllSites
            ? i18n.permission_status_granted
            : i18n.permission_status_microsoft_only
        }}
      </p>
    </section>
    <div>
      <input
        type="checkbox"
        id="showRequiredPermission"
        v-model="showAllPermissions"
      />
      <label for="showRequiredPermission">{{
        i18n.permission_show_required_permissions
      }}</label>
    </div>
    <div v-for="permission in permissions" :key="permission.id">
      <h2>{{ permission.id }}</h2>
      <p>{{ permission.description }}</p>
      <p v-if="!permission.revocable">{{ i18n.permission_required }}</p>
      <button
        :disabled="!permission.revocable"
        v-if="permission.revocable"
        v-on:click="revoke(permission.id)"
      >
        {{ i18n.permission_revoke }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { Permission } from "../models/permission";

export default defineComponent({
  computed: {
    permissions: function () {
      return this.$store.state.permissions.permissions.filter(
        (permission: Permission) => {
          return this.showAllPermissions || permission.revocable;
        },
      );
    },
  },
  data: function () {
    return {
      showAllPermissions: false,
      smartAutofillAllSites: false,
    };
  },
  async created() {
    await this.refreshSmartAutofillPermission();
  },
  methods: {
    async refreshSmartAutofillPermission() {
      this.smartAutofillAllSites = await chrome.permissions.contains({
        origins: ["http://*/*", "https://*/*"],
      });
    },
    async grantSmartAutofillSites() {
      await chrome.permissions.request({
        origins: ["http://*/*", "https://*/*"],
      });
      await this.refreshSmartAutofillPermission();
      chrome.runtime.sendMessage({
        action: "refreshSmartAutofillRegistration",
      });
    },
    async revokeSmartAutofillSites() {
      await chrome.permissions.remove({
        origins: ["http://*/*", "https://*/*"],
      });
      await this.refreshSmartAutofillPermission();
      chrome.runtime.sendMessage({
        action: "refreshSmartAutofillRegistration",
      });
    },
    revoke(permissionId: string) {
      this.$store.commit("permissions/revokePermission", permissionId);
    },
  },
});
</script>
