import { h, createApp, VNode, defineComponent } from 'vue'

import { VueWrapper, createWrapper } from './vue-wrapper'
import { createEmitMixin } from './emitMixin'
import { createDataMixin } from './dataMixin'

type Slot = VNode | string

interface MountingOptions<Props> {
  data?: () => Record<string, unknown>
  props?: Props
  slots?: {
    default?: Slot
    [key: string]: Slot
  }
  plugins?: any[]
  mixins?: any[]
  provides?: Record<any, any>
  stubs?: Record<string, any>
  globalProperties?: Record<any, any>
}

export function mount<P>(
  component: any,
  options?: MountingOptions<P>
): VueWrapper {
  // Reset the document.body
  document.getElementsByTagName('html')[0].innerHTML = ''
  const el = document.createElement('div')
  el.id = 'app'
  document.body.appendChild(el)

  // handle any slots passed via mounting options
  const slots =
    options?.slots &&
    Object.entries(options.slots).reduce<Record<string, () => VNode | string>>(
      (acc, [name, fn]) => {
        acc[name] = () => fn
        return acc
      },
      {}
    )

  // create the wrapper component
  const Parent = (props?: P) =>
    defineComponent({
      render() {
        return h(component, props, slots)
      }
    })

  // create the vm
  const vm = createApp(Parent(options && options.props))

  // override component data with mounting options data
  if (options?.data) {
    const dataMixin = createDataMixin(options.data())
    vm.mixin(dataMixin)
  }

  // use and plugins from mounting options
  if (options?.plugins) {
    for (const use of options.plugins) vm.use(use)
  }

  // use any mixins from mounting options
  if (options?.mixins) {
    for (const mixin of options.mixins) vm.mixin(mixin)
  }

  // provide any values passed via provides mounting option
  if (options?.provides) {
    for (const key of Reflect.ownKeys(options.provides)) {
      // @ts-ignore: https://github.com/microsoft/TypeScript/issues/1863
      vm.provide(key, options.provides[key])
    }
  }

  // mock globally available properties
  if (options?.globalProperties) {
    Object.entries(options.globalProperties).forEach(([key, value]) => {
      vm.config.globalProperties[key] = value
    })
  }

  // add tracking for emitted events
  const { emitMixin, events } = createEmitMixin()
  vm.mixin(emitMixin)

  // mount the app!
  const app = vm.mount('#app')

  return createWrapper(app, events)
}
