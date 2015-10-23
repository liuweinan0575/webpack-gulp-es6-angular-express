class ParallelcoordsController {
  /*@ngInject*/
  constructor($scope, $http) {
    this.name = 'parallelcoords';
    $http.get('datasets/cars').then(response => {
      $scope.data = response.data;
      $scope.$emit('data_ready');
    });
  }
}

export default ParallelcoordsController;
