import template from './radarplots.html';
import controller from './radarplots.controller';

class RadarplotsDirective {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
    this.template = template;
    this.controller = controller;
    this.controllerAs = 'vm';
    this.bindToController = true;
  }
}

export default RadarplotsDirective;
