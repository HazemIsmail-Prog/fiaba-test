import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const message = ref("");
  const kind = ref<"ok" | "error">("ok");
  let timer = 0;

  function show(text: string, type: "ok" | "error" = "ok") {
    message.value = text;
    kind.value = type;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      message.value = "";
    }, 3200);
  }

  function dismiss() {
    window.clearTimeout(timer);
    message.value = "";
  }

  return { message, kind, show, dismiss };
});
