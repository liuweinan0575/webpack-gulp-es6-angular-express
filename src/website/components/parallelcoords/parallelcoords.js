import uiRouter from 'angular-ui-router';
import ParallelCoordsDirective from './parallelcoords.directive';

let parallelcoordsModule = registerAngularModule('parallelcoords', [
  uiRouter
]).directive('parallelcoords', ParallelCoordsDirective);

export default parallelcoordsModule;
