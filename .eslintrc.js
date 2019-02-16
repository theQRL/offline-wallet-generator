module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    'plugin:vue/recommended',
    '@vue/airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'max-len': 'off',
    'vue/max-attributes-per-line': 3,
    "vue/v-bind-style": ["longform"],
    "vue/v-on-style" : ["longform"],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
