import { ComponentPublicInstance, nextTick } from 'vue'
import { ShapeFlags } from '@vue/shared'

import { DOMWrapper } from './dom-wrapper'
import { WrapperAPI } from './types'
import { ErrorWrapper } from './error-wrapper'
import { MOUNT_ELEMENT_ID } from './constants'
import { find } from './utils/find'

interface RefSelector {
  ref: string
}

interface NameSelector {
  name: string
}

type FindComponentSelector = RefSelector | NameSelector | string
type FindAllComponentsSelector = NameSelector | string

export class VueWrapper implements WrapperAPI {
  private componentVM: ComponentPublicInstance
  private __emitted: Record<string, unknown[]> = {}
  private __vm: ComponentPublicInstance
  private __setProps: (props: Record<string, any>) => void

  constructor(
    vm: ComponentPublicInstance,
    events: Record<string, unknown[]>,
    setProps: (props: Record<string, any>) => void
  ) {
    this.__vm = vm
    this.__setProps = setProps
    this.componentVM = this.vm.$refs['VTU_COMPONENT'] as ComponentPublicInstance
    this.__emitted = events
  }

  private get appRootNode() {
    return document.getElementById(MOUNT_ELEMENT_ID) as HTMLDivElement
  }

  private get hasMultipleRoots(): boolean {
    // if the subtree is an array of children, we have multiple root nodes
    return this.componentVM.$.subTree.shapeFlag === ShapeFlags.ARRAY_CHILDREN
  }

  private get parentElement(): Element {
    return this.componentVM.$el.parentElement
  }

  get element(): Element {
    // if the component has multiple root elements, we use the parent's element
    return this.hasMultipleRoots ? this.parentElement : this.componentVM.$el
  }

  get vm(): ComponentPublicInstance {
    return this.__vm
  }

  classes(className?: string) {
    return new DOMWrapper(this.element).classes(className)
  }

  attributes(key?: string) {
    return new DOMWrapper(this.element).attributes(key)
  }

  exists() {
    return true
  }

  emitted() {
    return this.__emitted
  }

  html() {
    return this.appRootNode.innerHTML
  }

  text() {
    return this.element.textContent?.trim()
  }

  find<T extends Element>(selector: string): DOMWrapper<T> | ErrorWrapper {
    // force using the parentElement to allow finding the root element
    const result = this.parentElement.querySelector(selector) as T
    if (result) {
      return new DOMWrapper(result)
    }

    return new ErrorWrapper({ selector })
  }

  findComponent(selector: FindComponentSelector): any {
    if (typeof selector === 'object' && 'ref' in selector) {
      return this.componentVM.$refs[selector.ref]
    }
    const result = find(this.componentVM.$.subTree, selector)
    return result.length ? result[0] : result
  }

  findAllComponents(selector: FindAllComponentsSelector): any[] {
    return find(this.componentVM.$.subTree, selector)
  }

  findAll<T extends Element>(selector: string): DOMWrapper<T>[] {
    const results = this.appRootNode.querySelectorAll<T>(selector)
    return Array.from(results).map((x) => new DOMWrapper(x))
  }

  setProps(props: Record<string, any>) {
    this.__setProps(props)
    return nextTick()
  }

  trigger(eventString: string) {
    const rootElementWrapper = new DOMWrapper(this.element)
    return rootElementWrapper.trigger(eventString)
  }
}

export function createWrapper(
  vm: ComponentPublicInstance,
  events: Record<string, unknown[]>,
  setProps: (props: Record<string, any>) => void
): VueWrapper {
  return new VueWrapper(vm, events, setProps)
}
