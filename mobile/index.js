import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// under the hood, and (crucially for web) also ensures the app is mounted
// against the correct root DOM node. Without this call, Metro will bundle
// and serve App.js just fine - it just never tells any platform to render
// it, which is why the page loads to a blank white screen with no error.
registerRootComponent(App);
