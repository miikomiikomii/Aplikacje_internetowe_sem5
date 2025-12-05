const WeatherApp = class {
    constructor(apiKey, resultBlockSelector) {
        this.apiKey = apiKey;
        this.resultBlock = document.querySelector(resultBlockSelector);

        this.currentWeatherLink = `https://api.openweathermap.org/data/2.5/weather?q={query}&appid=${apiKey}&units=metric&lang=pl`;
        this.forecastLink = `https://api.openweathermap.org/data/2.5/forecast?q={query}&appid=${apiKey}&units=metric&lang=pl`;

        this.currentWeather = undefined;
        this.forecast = undefined;


    }

    getCurrentWeather(query) {
        let url = this.currentWeatherLink.replace("{query}", query);
        let req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.addEventListener("load", () => {
            console.log(JSON.parse(req.responseText))
            this.currentWeather = JSON.parse(req.responseText);
            this.drawWeather();
        })
        req.send();
    }

    getForecast(query) {
        let url = this.forecastLink.replace("{query}", query);
        fetch(url)
            .then((response) => {
                console.log(response)
                return response.json();
            })
        .then((data) => {
            this.forecast = data.list;
            this.drawWeather();
        });
    }

    getWeather(query) {
        this.getCurrentWeather(query);
        this.getForecast(query);
    }

    drawWeather() {
        const currentWeatherContainer = document.querySelector("#current-weather");
        const forecastContainer = this.resultBlock; // #weather-results-container

        // Czyścimy oba
        currentWeatherContainer.innerHTML = "";
        forecastContainer.innerHTML = "";

        if (this.currentWeather) {
            const date = new Date(this.currentWeather.dt * 1000);
            const weatherBlock = this.createWeatherBlock(
                `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`,
                this.currentWeather.main.temp,
                this.currentWeather.main.feels_like,
                this.currentWeather.weather[0].icon,
                this.currentWeather.weather[0].description,
                this.currentWeather.name
            );
            weatherBlock.classList.add("weather-block-current"); // dodatkowa klasa na większe okno
            currentWeatherContainer.appendChild(weatherBlock);
        }

        if (this.forecast) {
            for (let i = 0; i < this.forecast.length; i++) {
                let weather = this.forecast[i];
                const date = new Date(weather.dt * 1000);

                const weatherBlock = this.createWeatherBlock(
                    `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`,
                    weather.main.temp,
                    weather.main.feels_like,
                    weather.weather[0].icon,
                    weather.weather[0].description
                );
                weatherBlock.classList.add("weather-block-forecast");
                forecastContainer.appendChild(weatherBlock);
            }
        }
    }

    createWeatherBlock(dateString, temperature, feelsLikeTemperature, iconName, description, cityName) {
        const weatherBlock = document.createElement("div");
        weatherBlock.className = "weather-block";

        // --- wspólne elementy ---
        const dateBlock = document.createElement("div");
        dateBlock.className = "weather-date";
        dateBlock.innerHTML = dateString;

        const temperatureBlock = document.createElement("div");
        temperatureBlock.className = "weather-temperature";
        temperatureBlock.innerHTML = `${temperature}&deg;C`;

        const temperatureFeelBlock = document.createElement("div");
        temperatureFeelBlock.className = "weather-temperature-feels-like";
        temperatureFeelBlock.innerHTML = `Feel: ${feelsLikeTemperature}&deg;C`;

        const iconImg = document.createElement("img");
        iconImg.className = "weather-icon";
        iconImg.src = `http://openweathermap.org/img/wn/${iconName}@2x.png`;

        const descriptionBlock = document.createElement("div");
        descriptionBlock.className = "weather-description";
        descriptionBlock.innerHTML = description;

        // --- układ dla obecnej pogody (jest cityName) ---
        if (cityName) {
            weatherBlock.classList.add("weather-block-current");

            const cityBlock = document.createElement("div");
            cityBlock.className = "weather-city";
            cityBlock.innerHTML = cityName;
            weatherBlock.appendChild(cityBlock);

            const mainRow = document.createElement("div");
            mainRow.className = "weather-main-row";
            weatherBlock.appendChild(mainRow);

            const leftCol = document.createElement("div");
            leftCol.className = "weather-main-left";
            mainRow.appendChild(leftCol);

            const rightCol = document.createElement("div");
            rightCol.className = "weather-main-right";
            mainRow.appendChild(rightCol);

            // lewa kolumna: temp + feel
            leftCol.appendChild(temperatureBlock);
            leftCol.appendChild(temperatureFeelBlock);

            // prawa kolumna: ikona + opis POD ikoną
            rightCol.appendChild(iconImg);
            rightCol.appendChild(descriptionBlock);

            // na dole: data, wyśrodkowana
            weatherBlock.appendChild(dateBlock);
        } else {
            // --- prosty układ dla prognozy ---
            weatherBlock.appendChild(dateBlock);
            weatherBlock.appendChild(temperatureBlock);
            weatherBlock.appendChild(temperatureFeelBlock);
            weatherBlock.appendChild(iconImg);
            weatherBlock.appendChild(descriptionBlock);
        }

        return weatherBlock;
    }


}

document.weatherApp = new WeatherApp("klucz api idzie tutaj", "#weather-results-container");

document.querySelector("#checkButton").addEventListener("click", function(){
    const query = document.querySelector("#locationInput").value;
    document.weatherApp.getWeather(query);
});

const forecastScroller = document.querySelector("#weather-results-container");


//Scrolowanie w bok listy
forecastScroller.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    forecastScroller.scrollLeft += evt.deltaY;

});
