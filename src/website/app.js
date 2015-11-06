import appConfig from 'config';

import './app.css';
import uiRouter from 'angular-ui-router';
import AppDirective from './app.directive';
import components from './components/components';

let app = registerAngularModule('app', [
    uiRouter,
    components.name
  ])
  .directive('app', AppDirective);

export default app;
