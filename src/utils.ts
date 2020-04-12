import mergeWith from 'lodash/mergeWith'

export function mergeGlobalProperties(configGlobal = {}, mountGlobal = {}) {
  return mergeWith({}, configGlobal, mountGlobal, (objValue, srcValue, key) => {
    switch (key) {
      case 'mocks':
      case 'provide':
      case 'components':
      case 'directives':
      case 'globalProperties':
        return { ...objValue, ...srcValue }
      case 'plugins':
      case 'mixins':
        return [...(objValue || []), ...(srcValue || [])].filter(Boolean)
    }
  })
}
