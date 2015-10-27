import 'common/googleFonts';
import RadarplotsDirective from './radarplots.directive';

let radarplotsModule = registerAngularModule('radarplots', [])
  .directive('radarplots', RadarplotsDirective);

export default radarplotsModule;
