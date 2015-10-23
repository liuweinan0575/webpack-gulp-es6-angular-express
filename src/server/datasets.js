import express from 'express';
import cars from './cars.json';

let router = express.Router();

router.get('/cars', function(req, res, next) {
  if (req.query) {
    let carsFiltered = _.filter(cars, req.query);
    res.json(carsFiltered);
  } else {
    res.json(cars);
  }
});

router.get('/cars/id/:id', function(req, res, next) {
  let car = _.find(cars, (car) => {
    return car.id === parseInt(req.params.id);
  });
  if (car) {
    res.json(car);
  } else {
    res.statusCode = 404;
    res.send('Error 404: No car with id ' + req.params.id + ' found');
  }
});

export default router;
