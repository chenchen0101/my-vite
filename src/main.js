import { createApp } from "vue"
import App from './App.vue'
createApp(App).mount("#app")

//当.js文件里又遇到了vue文件。就让vue文件名重写成相对路径(/@modules/vue)。浏览器得以解析，
//去modules目录下找vue。即可以在pack.json字段里找到相对应的文件的打包模块js