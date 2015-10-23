import uiRouter from 'angular-ui-router';
import RadarplotsDirective from './radarplots.directive';

let radarplotsModule = registerAngularModule('radarplots', [
    uiRouter
  ])
  .directive('radarplots', RadarplotsDirective);

export default radarplotsModule;
