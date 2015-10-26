import ParallelCoordsDirective from './parallelcoords.directive';

let parallelcoordsModule = registerAngularModule('parallelcoords', []).
  directive('parallelcoords', ParallelCoordsDirective);

export default parallelcoordsModule;
