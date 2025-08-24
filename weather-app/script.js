const weatherResult = document.getElementById("weatherResult");
const cityInput = document.getElementById("cityInput");
const getWeatherBtn = document.getElementById("getWeatherBtn");

async function getWeather(city) {
  try {
    const res = await fetch(`https://wttr.in/${city}?format=j1`);
    if (!res.ok) throw new Error("City not found");

    const current = (await res.json()).current_condition[0];

    weatherResult.innerHTML = `
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Temperature:</strong> ${current.temp_C}°C (Feels like: ${current.FeelsLikeC}°C)</p>
      <p><strong>Description:</strong> ${current.weatherDesc[0].value}</p>
      <p><strong>Humidity:</strong> ${current.humidity}%</p>
    `;
  } catch (err) {
    weatherResult.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

getWeatherBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});
