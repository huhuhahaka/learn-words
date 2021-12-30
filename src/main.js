import { createApp } from 'vue'
import App from './App.vue'

import axios from 'axios'

const app = createApp(App)

// axios.defaults.baseURL = './data'


app.config.globalProperties.axios=axios

app.mount('#app')
