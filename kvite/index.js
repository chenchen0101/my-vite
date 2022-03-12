//1、首先创建一个node服务器，处理浏览器加载各种资源的请求
/**服务器要做的三件事，
 * 1、创建index.html宿主页
 * 2、返回js
 * 3、解析请求vue
 */

//koa
const Koa = require('koa')
//创建实例
const app = new Koa()
//读取文件模块
const fs = require('fs')
//获取绝对路径
const path = require('path')
//解析sfc的编译器
const compilerSFC = require('@vue/compiler-sfc')
//模板的编译
const compilerDom = require('@vue/compiler-dom')

//中间件配置
//处理路由
app.use(async (ctx) => {
  const { url, query } = ctx.request;
  //先处理首页请求
  if (url === '/') {

    //加载index.html文件
    ctx.type = 'text/html'
    //注意index文件：kvite\index.html
    ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf8')

    //在.html文件里遇到了.js=>拼接url和.js文件的路径
  } else if (url.endsWith('.js')) {
    //js加载处理
    /*注意：main.js在根目录src\main.js
      所以把当前目录下文件名（绝对地址）和url进行拼接
     */

    //dirname:F:\前端复习\my-vite\kvite，'..'就是去dirname的上一级
    const p = path.join(__dirname, '..', url)

    ctx.type = 'application/javascript'
    /**如果main.js不在src目录下，则直接fs.readFileSync('./main.js', 'utf8')*/
    ctx.body = rewiteImport(fs.readFileSync(p, 'utf8'))

    //裸模块替换结果的加载
  } else if (url.startsWith('/@modules/')) {
    //得到裸模块名称
    const moduleName = url.replace('/@modules/', '')//"modules"替换为空，相当于获得原来的裸模块名称了
    //去modules目录中找
    const prefix = path.join(__dirname, "../node_modules", moduleName)

    //package.json获取modules字段
    const module = require(prefix + "/package.json").module;//后缀地址

    const filePath = path.join(prefix, module)//全部地址

    const ret = fs.readFileSync(filePath, 'utf8')
    ctx.type = 'application/javascript'
    ctx.body = rewiteImport(ret)
  } else if (url.indexOf('.vue') > -1) {
    const p = path.join(__dirname, '..', url.split("?")[0])
    const result = compilerSFC.parse(fs.readFileSync(p, 'utf8'))
    //判断请求体里是否有查询参，没有，直接解析脚本
    if (!query.type) {
      //SFC请求
      //读取vue文件，解析为js
      //获取脚本部分的内容
      const scriptContent = result.descriptor.script.content
      //将内容里的默认导出变成常量。还要对渲染函数（setup()函数）进行解析，渲染函数来自于对template的解析
      //替换默认导出为一个常量，方便后续修改=》就是做代码生成
      const script = scriptContent.replace('export default', 'const __script =')
      ctx.type = 'application/javascript'
      ctx.body = `
    //拼接返回给前端的js代码
    ${rewiteImport(script)}
    //解析tpl
    import {render as __render} from '${url}?type=template'
    __script.render = __render
    export default __script
    `
      //查询参类型为template，就解析template
    } else if (query.type === 'template') {
      const tpl = result.descriptor.template.content
      //编译为render
      const render = compilerDom.compile(tpl, { mode: 'module' }).code
      console.log(render);
      ctx.type = 'application/javascript'
      ctx.body = rewiteImport(render)
    }
  }

});

//对裸模块地址的重写（再次发送一个相对地址的请求，去node_modules里找vue文件），工具模块，工具方法
//import xx from 'vue'=>import xx from '/@modules/vue'
function rewiteImport(content) {
  //s1是匹配的部分，s2是分组的内容
  return content.replace(/ from ['"](.*)['"]/g, function (s1, s2) {
    //如果是相对地址，直接返回
    if (s2.startsWith("./") || s2.startsWith("/") || s2.startsWith("../")) {
      return s1
    } else {
      //裸模块，替换
      return ` from '/@modules/${s2}'`
    }
  })
}
app.listen(3000, () => {
  console.log('startup');
})