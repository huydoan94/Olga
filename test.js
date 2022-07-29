#!/usr/bin/env node

function calculateDaysBetweenDates(begin,end) {
  var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
  var firstDate = new Date(begin);
  var secondDate = new Date(end);

  return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
}

console.log(calculateDaysBetweenDates("01/01/2014","01/01/2015"));

function calculateMultiplicationAndDivisionOfTwoNumbers(input1,input2) {
  var result = {};
  result.multiplication = input1 * input2;
  result.division = input1 / input2;
  return result;
  
}
console.log(result);
