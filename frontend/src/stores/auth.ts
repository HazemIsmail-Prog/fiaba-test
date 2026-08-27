import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, type AuthUser } from "../api.ts";

export const useAuthStore = defineStore("auth", () => {
  const stored = localStorage.getItem("fiaba_user");
  const user = ref<AuthUser | null>(stored ? (JSON.parse(stored) as AuthUser) : null);
  const token = ref(localStorage.getItem("fiaba_token") || "");

  const isLoggedIn = computed(() => Boolean(token.value && user.value));
  const role = computed(() => user.value?.role ?? "");
  const isStaff = computed(() =>
    ["admin", "manager", "accountant", "secretary"].includes(role.value)
  );
  const canCms = computed(() => ["admin", "manager"].includes(role.value));
  const canUsers = computed(() => ["admin", "manager"].includes(role.value));
  const canClients = computed(() => ["admin", "manager", "secretary"].includes(role.value));
  const canEvents = computed(() =>
    ["admin", "manager", "secretary", "accountant"].includes(role.value)
  );
  const canAppointments = computed(() => ["admin", "manager", "secretary"].includes(role.value));
  const canFinance = computed(() => ["admin", "manager", "accountant"].includes(role.value));
  const canContracts = computed(() =>
    ["admin", "manager", "accountant", "secretary"].includes(role.value)
  );
  const canMeetings = computed(() => ["admin", "manager", "secretary"].includes(role.value));

  function persist() {
    if (token.value) localStorage.setItem("fiaba_token", token.value);
    else localStorage.removeItem("fiaba_token");
    if (user.value) localStorage.setItem("fiaba_user", JSON.stringify(user.value));
    else localStorage.removeItem("fiaba_user");
  }

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    token.value = data.token;
    user.value = data.user;
    persist();
  }

  async function fetchMe() {
    if (!token.value) return;
    const data = await api<{ user: AuthUser }>("/api/auth/me");
    user.value = data.user;
    persist();
  }

  function logout() {
    token.value = "";
    user.value = null;
    persist();
  }

  return {
    user,
    token,
    isLoggedIn,
    role,
    isStaff,
    canCms,
    canUsers,
    canClients,
    canEvents,
    canAppointments,
    canFinance,
    canContracts,
    canMeetings,
    login,
    fetchMe,
    logout,
  };
});
