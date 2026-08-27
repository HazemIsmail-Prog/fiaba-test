import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth.ts";
import LoginView from "./views/LoginView.vue";
import ClientEvents from "./views/client/ClientEvents.vue";
import ClientEventDetail from "./views/client/ClientEventDetail.vue";
import ClientAppointments from "./views/client/ClientAppointments.vue";
import ClientInvoices from "./views/client/ClientInvoices.vue";
import ClientPayments from "./views/client/ClientPayments.vue";
import ClientMeetings from "./views/client/ClientMeetings.vue";
import ClientContracts from "./views/client/ClientContracts.vue";
import StaffUsers from "./views/staff/StaffUsers.vue";
import StaffClients from "./views/staff/StaffClients.vue";
import StaffEvents from "./views/staff/StaffEvents.vue";
import StaffEventDetail from "./views/staff/StaffEventDetail.vue";
import StaffAppointments from "./views/staff/StaffAppointments.vue";
import StaffInvoices from "./views/staff/StaffInvoices.vue";
import StaffPayments from "./views/staff/StaffPayments.vue";
import StaffMeetings from "./views/staff/StaffMeetings.vue";
import StaffContracts from "./views/staff/StaffContracts.vue";
import StaffWebsite from "./views/staff/StaffWebsite.vue";

declare module "vue-router" {
  interface RouteMeta {
    public?: boolean;
    staff?: boolean;
    client?: boolean;
    can?:
      | "canUsers"
      | "canClients"
      | "canEvents"
      | "canAppointments"
      | "canFinance"
      | "canContracts"
      | "canMeetings"
      | "canCms";
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { public: true } },
    { path: "/", redirect: "/events" },
    { path: "/events", name: "events", component: ClientEvents, meta: { client: true } },
    {
      path: "/events/:id",
      name: "event-detail",
      component: ClientEventDetail,
      meta: { client: true },
    },
    {
      path: "/appointments",
      name: "appointments",
      component: ClientAppointments,
      meta: { client: true },
    },
    { path: "/invoices", component: ClientInvoices, meta: { client: true } },
    { path: "/payments", component: ClientPayments, meta: { client: true } },
    { path: "/meetings", component: ClientMeetings, meta: { client: true } },
    { path: "/contracts", component: ClientContracts, meta: { client: true } },
    { path: "/staff/users", component: StaffUsers, meta: { staff: true, can: "canUsers" } },
    { path: "/staff/clients", component: StaffClients, meta: { staff: true, can: "canClients" } },
    { path: "/staff/events", component: StaffEvents, meta: { staff: true, can: "canEvents" } },
    {
      path: "/staff/events/:id",
      component: StaffEventDetail,
      meta: { staff: true, can: "canEvents" },
    },
    {
      path: "/staff/appointments",
      component: StaffAppointments,
      meta: { staff: true, can: "canAppointments" },
    },
    { path: "/staff/meetings", component: StaffMeetings, meta: { staff: true, can: "canMeetings" } },
    { path: "/staff/contracts", component: StaffContracts, meta: { staff: true, can: "canContracts" } },
    { path: "/staff/invoices", component: StaffInvoices, meta: { staff: true, can: "canFinance" } },
    { path: "/staff/payments", component: StaffPayments, meta: { staff: true, can: "canFinance" } },
    { path: "/staff/finance", redirect: "/staff/invoices" },
    { path: "/staff/website", component: StaffWebsite, meta: { staff: true, can: "canCms" } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    if (auth.isLoggedIn) return auth.isStaff ? "/staff/events" : "/events";
    return true;
  }
  if (!auth.isLoggedIn) return "/login";
  if (to.meta.staff && !auth.isStaff) return "/events";
  if (to.meta.client && auth.isStaff) return "/staff/events";
  if (to.meta.can && !auth[to.meta.can]) return auth.isStaff ? "/staff/events" : "/events";
  return true;
});
