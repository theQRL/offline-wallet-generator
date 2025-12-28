import { reactive } from 'vue';

const state = reactive({
  hash: 'SHAKE_128',
  height: 10,
});

export default {
  state,
  install(app) {
    app.config.globalProperties.$store = this;
  },
};
