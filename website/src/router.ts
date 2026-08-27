import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import ServicesView from "./views/ServicesView.vue";
import AboutView from "./views/AboutView.vue";
import AppointmentView from "./views/AppointmentView.vue";
import GalleryView from "./views/GalleryView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/services", name: "services", component: ServicesView },
    { path: "/gallery", name: "gallery", component: GalleryView },
    { path: "/about", name: "about", component: AboutView },
    { path: "/appointment", name: "appointment", component: AppointmentView },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
