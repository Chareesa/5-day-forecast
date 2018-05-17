const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()

const apiKey = process.env.APP_ID;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index');
})

app.post('/', function (req, res) {
  let city = req.body.city;
  let url = `http://api.openweathermap.org/data/2.5/forecast?q=${city},us&units=imperial&appid=${apiKey}`

  request(url, function (err, response, body) {
    if(err){
      res.render('index', {error: 'Error, please try again!'});
    } else {
        let weather = JSON.parse(body);
        if(weather.list == undefined){
            res.render('index', {error: 'We could not find that city,\n please try again...'});
        } else {
            let forecast = getForecast(weather.list).five_day_forecast;
            let weatherText = `It's weather!`;
            res.render('index', {weather: weatherText, forecast: forecast});
        }
    }
  });
})

app.listen(8080, function () {
  console.log('Weather app listening on port 8080!')
})

function getForecast(weatherList) {
    // The default day to compare against
    let day = createDay(weatherList[0])
    let forecast = {"five_day_forecast": []}

    // Incoming data (weatherList) is for every 3 hours for the next 5 days
    weatherList.forEach(function(listItem) {
        // If this item is in the current day we're looking at, find min, max and the day's best weather icon ;).
        if (listItem.dt_txt.slice(0,10) == day.currentDay) {
            if (listItem.main.temp_min < day.min) {
                day.min = Math.round(listItem.main.temp_min);
            }
            if (listItem.main.temp_max > day.max) {
                day.max = Math.round(listItem.main.temp_max);
                day.iconUrl = createIconUrl(listItem);
            }
          // If this item is not in the current day, push what we have and re-set values for new day.
        } else {
            forecast.five_day_forecast.push({
                "min": day.min, 
                "max": day.max, 
                "date": day.month, 
                "iconUrl": day.iconUrl
            });
            day = createDay(listItem);
        }
    })

    // Add the last day
    forecast.five_day_forecast.push({
        "min": day.min, 
        "max": day.max, 
        "date": day.month, 
        "iconUrl": day.iconUrl
    });
    return forecast;
}

function createDay(weatherListItem) {
    let day = weatherListItem.dt_txt.slice(0,10);
    let date = new Date(day);
    return {
        "currentDay": day,
        "min": Math.round(weatherListItem.main.temp_min),
        "max": Math.round(weatherListItem.main.temp_max),
        "month": date.toLocaleString("en-us", { month: "short", day: "numeric" }),
        "iconUrl": createIconUrl(weatherListItem)
    }
}

function createIconUrl(weatherListItem) {
    return "http://openweathermap.org/img/w/" + weatherListItem.weather[0].icon + ".png";
}