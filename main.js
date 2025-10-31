const API_KEY = "5fa70bff2d5483e4e851a89daba7c39d";

const searchBtn = document.getElementById("search");
const cityInput = document.getElementById("city");
const currentDiv = document.getElementById("current");
const forecastDiv = document.getElementById("forecast");
let lastRequest = 0;
const COOLDOWN = 2000; // 2 seconds

async function safeFetch(url) {
  const now = Date.now();
  if (now - lastRequest < COOLDOWN) {
    throw new Error("Please wait...");
  }
  lastRequest = now;
  const res = await fetch(url);
  return res;
}
// Add after your variables
let lastSearch = 0;
const DEBOUNCE_TIME = 1000; // 1 sec cooldown

// Replace searchBtn.addEventListener
searchBtn.addEventListener("click", () => {
  const now = Date.now();
  if (now - lastSearch < DEBOUNCE_TIME) {
    alert("Chill! One search per second.");
    return;
  }
  lastSearch = now;
  // ... rest of your code
});


// === THEME TOGGLE ===
const themeBtn = document.getElementById("theme-toggle");
let isDark = true;

// Start in dark mode
document.body.classList.add("dark");
themeBtn.textContent = "Light Mode";

themeBtn.addEventListener("click", () => {
  isDark = !isDark;
  document.body.classList.toggle("light", !isDark);
  document.body.classList.toggle("dark", isDark);
  themeBtn.textContent = isDark ? "Light Mode" : "Dark Mode";
  updateParticles();
});
// === END THEME ===
// Auto-detect location on load
// Auto-detect location on load (with accuracy fixes)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
  async (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    console.log(`GPS: Lat ${latitude}, Lng ${longitude} (±${accuracy}m)`);

    if (accuracy > 1000) {
      cityInput.placeholder = "Location too vague — search a city";
      return;
    }

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();

      // === ICON LOGIC ===
      const iconMap = { "01": "sunny", "02": "partly_cloudy", "03": "cloud", "04": "cloud", "09": "rain", "10": "rain", "11": "storm", "13": "snow", "50": "mist" };
      const icon = iconMap[data.weather[0].icon.slice(0,2)] || "cloud";

      // === SHOW "YOUR LOCATION" ===
      currentDiv.innerHTML = `
        <div class="card">
          <h2>Your Location</h2>
          <p style="font-size: 0.9rem; opacity: 0.8; margin: 0.5rem 0;">
            📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
          </p>
          <div class="temp">${Math.round(data.main.temp)}°</div>
          <div class="description">${data.weather[0].description}</div>
          <lottie-player 
            src="https://assets5.lottiefiles.com/packages/lf20_${icon}.json" 
            background="transparent" speed="1" loop autoplay 
            style="width: 180px; height: 180px; margin: 1rem auto;">
          </lottie-player>
          <div class="details">
            <div>Humidity: <strong>${data.main.humidity}%</strong></div>
            <div>Wind: <strong>${data.wind.speed} m/s</strong></div>
          </div>
        </div>
      `;
      cityInput.placeholder = "Your location (auto-detected)";

      // Trigger rain if needed
      updateParticles(data.weather[0].main);
    } catch (err) {
      console.error("API failed:", err);
    }
  },
  (error) => { /* ... */ },
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
);
}


// Search on button click
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
    cityInput.value = "";
  }
});

// Search on Enter key
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// === FETCH WEATHER ===
async function fetchWeather(city) {
  try {
    currentDiv.innerHTML = "<p>Loading...</p>";
    forecastDiv.innerHTML = "";

    const cleanCity = city.trim().split(',')[0].split(' ')[0];
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cleanCity}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    displayCurrent(data.city, data.list[0]);
    displayForecast(data.list);
  } catch (err) {
  currentDiv.innerHTML = `
    <div class="card">
      <h2>Oops! Couldn't find "${city}"</h2>
      <p>Try exact city names:</p>
      <ul style="text-align: left; margin: 1rem 0; font-size: 0.95rem; opacity: 0.9;">
        <li>London</li>
        <li>New York</li>
        <li>Tokyo</li>
        <li>Mumbai</li>
      </ul>
      <button onclick="fetchWeather('London')" class="error-btn">Try London</button>
    </div>
  `;
  forecastDiv.innerHTML = ""; // Clear forecast
}
}

// === DISPLAY CURRENT WEATHER ===
function displayCurrent(city, weather) {
  const iconMap = {
    "01": "sunny", "02": "partly_cloudy", "03": "cloud", "04": "cloud",
    "09": "rain", "10": "rain", "11": "storm", "13": "snow", "50": "mist"
  };
  const code = weather.weather[0].icon.slice(0, 2);
  const icon = iconMap[code] || "cloud";

  currentDiv.innerHTML = `
    <div class="card">
      <h2>${city.name}, ${city.country}</h2>
      <div class="temp">${Math.round(weather.main.temp)}°</div>
      <div class="description">${weather.weather[0].description}</div>
      <lottie-player 
        src="https://assets5.lottiefiles.com/packages/lf20_${icon}.json" 
        background="transparent" 
        speed="1" 
        loop 
        autoplay 
        style="width: 180px; height: 180px; margin: 1rem auto;">
      </lottie-player>
      <div class="details">
        <div>Humidity: <strong>${weather.main.humidity}%</strong></div>
        <div>Wind: <strong>${weather.wind.speed} m/s</strong></div>
      </div>
    </div>
  `;

  // Update particles based on weather
  updateParticles(weather.weather[0].main);
}

// === DISPLAY 5-DAY FORECAST ===
function displayForecast(list) {
  const daily = list.filter((_, i) => i % 8 === 0).slice(0, 5);
  
  const iconMap = {
    "01": "sunny", "02": "partly_cloudy", "03": "cloud", "04": "cloud",
    "09": "rain", "10": "rain", "11": "storm", "13": "snow", "50": "mist"
  };

  forecastDiv.innerHTML = `
    <div class="forecast-container">
      <h2>5-Day Forecast</h2>
      <div class="forecast">
        ${daily.map(day => {
          const code = day.weather[0].icon.slice(0, 2);
          const icon = iconMap[code] || "cloud";
          return `
            <div class="forecast-card">
              <p><strong>${new Date(day.dt * 1000).toLocaleDateString('en', {weekday: 'short'})}</strong></p>
              <lottie-player 
                src="https://assets5.lottiefiles.com/packages/lf20_${icon}.json" 
                background="transparent" 
                speed="1" 
                loop 
                autoplay 
                style="width: 60px; height: 60px; margin: 0.5rem auto;">
              </lottie-player>
              <p class="temp">${Math.round(day.main.temp)}°</p>
              <p>${day.weather[0].description}</p>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// === PARTICLES (RAIN EFFECT) ===
function updateParticles(condition = "") {
  const particles = document.getElementById("particles");
  particles.innerHTML = "";

  if (["Rain", "Drizzle"].includes(condition)) {
    for (let i = 0; i < 60; i++) {
      const rain = document.createElement("div");
      rain.style.position = "absolute";
      rain.style.width = "2px";
      rain.style.height = "20px";
      rain.style.background = "rgba(255,255,255,0.6)";
      rain.style.left = Math.random() * 100 + "%";
      rain.style.top = "-20px";
      rain.style.animation = `rain ${0.5 + Math.random() * 0.5}s linear infinite`;
      rain.style.animationDelay = Math.random() + "s";
      particles.appendChild(rain);
    }
  }
}

// Add rain animation CSS
const style = document.createElement("style");
style.textContent = `
@keyframes rain {
  to { transform: translateY(100vh); }
}
`;
document.head.appendChild(style);