---
title: Vue 2.5.9 源码分析（二） ~ Vue初始化之选项的合并及统一规范化处理
date: 2018-08-08 18:35:56
tags: ["源码分析", "Vue源码分析", "技能知识图谱"]
category: frontend
---

通过 Vue 构造函数的声明可以看出，在调用`new Vue({...options})`的同时，Vue 构造函数首先会调用`this._init()`，并将 Vue 的初始化选项作为参数传递进去，这也是初始化 Vue 的唯一入口。通过之前整理好的流程图，我们能够轻易地在`src/core/instance/init.js`中的`initMixin`找到\_init 的方法。

<!-- more -->

## 初始化的开始

首先，声明了一个名为`vm`的常量在存储当前的实例。

```
const vm: Component = this
```

为`vm`添加一个`_uid`字段，其值为一个每次 new Vue 都会自增的数值，以此来区分不同的 Vue 实例。

```
vm._uid = uid++
```

定义两个标记变量，作为开始和结束的标记，用于在支持 performance 的浏览器上测试性能；结束的标记在该方法[this_init()]的末端（倒数第四行).

```
let startTag, endTag
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
  startTag = `vue-perf-start:${vm._uid}`
  endTag = `vue-perf-end:${vm._uid}`
  //利用performance打上开始标记，相当于 performance.mark
  //详见until下的per.js文件中的描述
  mark(startTag)
}

/***
* 省略中间代码段
**/

/* istanbul ignore if */
//这里,跟上面开始打上开始标记相对应
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
  vm._name = formatComponentName(vm, false)
  mark(endTag)
  measure(`vue ${vm._name} init`, startTag, endTag)
}
```

为当前实例添加一个`_isVue`字段，其作用是为了避免在后面的数据响应式处理的过程中将 Vue 实例 observe。

```
vm._isVue = true
```

紧接着下面的一段代码，就是本文主要分析的入口，这也是第一次在`_init`方法内部使用初始化 Vue 时传入的 options。首先判断了`options._isComponent`的值为真假；因为我们并没有在 Vue 的文档中找到`_isComponent`的初始化选项，所以初步猜测应该还会有其他的地方可以调用`this._init()`（ 没关系，后面遇到了自然会明白的）。

```
    if (options && options._isComponent) {
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
```

下面，我们以一个最简单的例子来调用一下 Vue，通过 debug 来看一下真实的运行时的是否如我们预期的一样。

```
var demo = new Vue({
  data:{
    a:1
  }
})

```

结果如图所示：

![debugger_Options_isComponent](/images/2018/8/vue-2/debugger_Options_isComponent.png)

## 选项的合并

通过上面的 debugger，最终在 vm 上挂载了一个`$options`，也就是`mergeOptions`的返回值，在弄清楚`mergeOptions`做了什么之前，我们首先需要弄清楚它在这里接收到的第一个参数`resolveConstructorOptions(vm.constructor)`。

#### resolveConstructorOptions

该方法接受构造函数作为参数*（在我们上面的示例中代表的是 Vue 构造函数）*，在方法的最开始，先定义了一个`options`缓存了构造函数 Vue 的`options`，要注意的是这里的 options 和上面的 options 不同；紧接着开始判断构造函数是否含有`super`字段：

> *⚠️ 这里需要说一下，起初被这个.super 搞晕了，看到 super 首先想起来 ES6 构造函数中的 super，它可以这样被调用：`super()`、`super.xx()`，或者直接在类的方法中调用，但是从未见过直接调用构造函数的 super 的这种写法，经过一番查证，初步猜测这里的 super 是自定义挂载上去的，并非 JS 本身内置的属性。至于在哪里定义的，暂且不得而知，姑且就先留下一个疑问，等后面遇到了再回过头来在这里说明一下。*❓❓❓

OK，我们通过语义，暂时猜测这是在判断当前的构造函数是否含有父类，这样理解，似乎更符合当前的意境。假设，当前的构造函数含有 super，便会递归调用`resolveConstructorOptions`，以此来合并出一个新的 options。目前按照上面的简单示例，是拿不到 super 的，因此在这里会直接将 Vue.options 返回。

#### mergeOptions

现在对于该方法接收到的三个参数，我们已经了解了它们所代表的含义，下面再结合 debug 断点调试来简单的说明一下：

![mergeOptions_params](/images/2018/8/vue-2/mergeOptions_params.png)

进入到 mergeOptions 中，首先在非生产环境下，会通过`checkComponents`方法判断 components 选项的合法性，如果在 Vue 初始化的时候传入了 components，那么需要判断传入的 component 中的组件名称是否为 html 标签，避免用户自定义的 components 名称和已存在的 html 标签冲突，例如:`html`，`script`，`link`，`div`等等。

通过判断 child 类型，也就是构造函数传入的初始化选项，来判断并获取到最终的 Options 对象。

> *⚠️ 至于在何种情景下会获取到的是一个 Function，暂时先留下一个疑问*❓❓❓

```
  if (typeof child === 'function') {
    child = child.options
  }
```

下面，就开始了对初始化选项的统一规范化处理。

#### normalizeProps

```
  //统一规范props
  normalizeProps(child, vm)
```

获取到当前实例化 Vue 传入的 options

```
 const props = options.props
```

未获取到 props 则终止，props 在初始化的过程中是一个可选项。

```
 if (!props) return
```

接下来，通过判断 props 的类型来分别对`Object`类型或`Array`类型的 props 进行统一的规范化的处理。

props 接受一个对象/数组，这一点在 Vue 的官方文档中也有相关的说明：

```
props:['name','age']
```

又可以传入一个对象:

```
props:{
	name:{
		value:'',
		type:String,
		default
	},
	...
}
```

所以，下面的代码就是对这两种类型进行处理：

```
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
```

开始定义了 res，它也是最终处理完之后并返回的对象。
根据 props 传入的类型：

- 为 Array，进行数组遍历，将每一项进行`camelize`，最终会转换成:res[name] = { type: null }
- 为 Object，将对象的 key 进行遍历访问，对每一个 key 进行`camelize`，与数组不同的是，需要判断一下每一个的 props 的值是否为对象，如果为对象，会直接返回。
- 既不是 Array，又不是 Object，在非生产环境下会给出错误提示。

其中,`camelize`方法是将 props 的进行驼峰式命名格式处理，如果当前传入的 props 为`aa-xx`，最终会处理成`aaXx`，如果没有命名中没有`-`符号，就会原样返回。

最后，通过改写一下上面的示例来验证一下我们的想法：

```
var demo = new Vue({
  data:{
    a:1
  },
  props:['js-bridge','vueprops']
  // props:{
  // 	'jsbridge':{
  // 		type:String,
  // 		value:'test',
  // 		default:'default value'
  // 	},
  // 	'vue-props':'hehehe'
  // }
})
```

![normalizePropsExample](/images/2018/8/vue-2/normalizePropsExample.png)

#### normalizeInject

```
  //统一规范Inject
  normalizeInject(child, vm)
```

Inject/Provide 是 Vue 提供的一个初始化选项，同样是可选项。可通过 Provide 在父组件传入数据，在其子组件通过 Inject 拿到之后，就可以在组件的示例中使用。

我们通过一个场景来描述一下这个选项的使用，Native 端需要嵌入一个基于 Vue 开发的单页应用，在 H5 端需要根据不同的渠道在一些登录/支付等等流程内采用不同的处理机制，在应用的根组件上我们便可以通过参数获取到渠道，再通过 provide 自顶向下传递，在需要判断渠道的子组件中，便可以通过 Inject 获取到。

_在之前的项目中，因为引入了 Vuex，大多数整个应用任何地方都需要访问的数据，我们都存在了 Vuex，如果项目的复杂性比较低，在不采用 Vuex 的前提下，Inject/Provide 这种自顶向下传递数据的方式还是很实用的。_

```
  const inject = options.inject
  const normalized = options.inject = {}
```

定义 inject 常量缓存初始化选项中的 inject，之后便将`options.inject`置空，同时赋值给新定义的 normalized 常量，根据 JS 引用类型的特性，实际上后面对 normalized 的修改等同于对`options.inject`的修改。

接下来，对 inject 做了同 props 同样的类型判断，inject 也只接收`Object`和`Array`类型的数据。

```
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production' && inject) {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
```

- 接收到的是数组，会将数组进行遍历，将每项包装成一个对象，对象内部含有一个 key 为 from，值为当前数组项的值。normalized[数组项] = {from:数组项}
- 接收到的是 Object 对象，将对象 key 进行遍历，与上面不同的是，如果对象内部的某个 key 的值为对象，会将该 key 的值和{from:key 名}进行合并，返回一个新的对象。

> *⚠️ 有一个疑问，类型为 Object 的时候，如果用户某个 key 值下的对象中，含有 key 为 from 的字段，此时进行合并会覆盖掉之前`{from:key名}`，此时 from 字段的值不再等于 key，可能会出现 bug*❓❓❓

下面，修改上面的示例，来验证一下。

```
var demo = new Vue({
  data:{
    a:1
  },
  // inject:['inject-test1','inject-test2'],
  inject:{
  	'inject-test1':{
  		from: 'f_test1'
  	},
  	'inject-test2':{
  		name: 'f_test2'
  	}
  }
})
```

![normalizeInjectExample](/images/2018/8/vue-2/normalizeInjectExample.png)

#### normalizeDirectives

对自定义指令进行统一规范化的处理，指令的用法移步官方文档。

```
  //统一规范Directives
  normalizeDirectives(child)
```

```
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
```

这个方法就简单多了，首先判断遍历`directives`，然后判断每项的类型是否是函数，是的话对每一个项改写成`{ bind: def, update: def }`的形式。

> *⚠️ 暂时不清楚什么情况下能在初始化选项中获取到 extends，尝试了 Vue.extend 构造出来的也没有发现*❓❓❓

```
  const extendsFrom = child.extends
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm)
  }
  //递归合并mixins传入的组件
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }
```

## End

这一小节，对初始化选项中的`props`,`inject`,`directives`进行了统一的规范处理，后面开始对各个初始化选项进行不同的策略的挂载。我们放到下一小节，继续分析。

（完）
