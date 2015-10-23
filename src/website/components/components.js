import parallelcoords from './parallelcoords/parallelcoords';
import radarplots from './radarplots/radarplots';

let componentModule = registerAngularModule('app.components', [
    parallelcoords.name,
    radarplots.name
  ])
  .config(($stateProvider, $urlRouterProvider) => {

    'ngInject';

    $urlRouterProvider.otherwise('/parcoords');

    $stateProvider
      .state('parcoords', {
        url: '/parcoords',
        template: '<parallelcoords></parallelcoords>'
      })
      .state('radplots', {
        url: '/radarplots',
        template: '<radarplots></radarplots>'
      });
  });

export default componentModule;
