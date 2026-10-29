// 1. URLs de la API (Open-Meteo no necesita API key)
const URL_GEOCODING = "https://geocoding-api.open-meteo.com/v1/search";
const URL_CLIMA = "https://api.open-meteo.com/v1/forecast";

// 2. Elementos del HTML
const inputCiudad = document.getElementById("ciudad");
const btnBuscar = document.getElementById("buscar");
const mensaje = document.getElementById("mensaje");
const seccionActual = document.getElementById("actual");
const seccionPronostico = document.getElementById("pronostico");

// 3. Open-Meteo devuelve un código numérico (WMO) para describir el clima
function describirClima(codigo) {
  if (codigo === 0) return { icono: "☀️", texto: "Despejado" };
  if (codigo <= 3) return { icono: "⛅", texto: "Parcialmente nublado" };
  if (codigo <= 48) return { icono: "🌫️", texto: "Niebla" };
  if (codigo <= 57) return { icono: "🌦️", texto: "Llovizna" };
  if (codigo <= 67) return { icono: "🌧️", texto: "Lluvia" };
  if (codigo <= 77) return { icono: "❄️", texto: "Nieve" };
  if (codigo <= 82) return { icono: "🌧️", texto: "Chubascos" };
  if (codigo <= 86) return { icono: "🌨️", texto: "Chubascos de nieve" };
  return { icono: "⛈️", texto: "Tormenta" };
}

// 4. Paso 1: convertir el nombre de la ciudad en coordenadas
async function obtenerCoordenadas(ciudad) {
  const url = `${URL_GEOCODING}?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("Error al buscar la ciudad");

  const datos = await respuesta.json();
  // Si no encuentra la ciudad, la propiedad 'results' no existe
  if (!datos.results) throw new Error("Ciudad no encontrada");

  return datos.results[0]; // name, country, latitude, longitude
}

// 5. Paso 2: pedir el clima con esas coordenadas
async function obtenerClima(latitud, longitud) {
  const url = `${URL_CLIMA}?latitude=${latitud}&longitude=${longitud}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("Error al obtener el clima");

  return await respuesta.json();
}

// 6. Función principal que une los dos pasos
async function buscarClima() {
  const ciudad = inputCiudad.value.trim();
  if (ciudad === "") {
    mensaje.textContent = "Escribe el nombre de una ciudad";
    return;
  }

  mensaje.textContent = "Cargando...";
  seccionActual.innerHTML = "";
  seccionPronostico.innerHTML = "";
  btnBuscar.disabled = true;

  try {
    const lugar = await obtenerCoordenadas(ciudad);
    const clima = await obtenerClima(lugar.latitude, lugar.longitude);

    mostrarActual(lugar, clima);
    mostrarPronostico(clima);
    mensaje.textContent = "";
  } catch (error) {
    mensaje.textContent = "Error: " + error.message;
  } finally {
    btnBuscar.disabled = false;
  }
}

// 7. Mostrar el clima actual
function mostrarActual(lugar, clima) {
  const c = clima.current;
  const u = clima.current_units;
  const estado = describirClima(c.weather_code);

  seccionActual.innerHTML = `
    <h2>${lugar.name}, ${lugar.country}</h2>
    <div class="icono">${estado.icono}</div>
    <div class="temp">${c.temperature_2m}${u.temperature_2m}</div>
    <p>${estado.texto}</p>
    <p>Humedad: ${c.relative_humidity_2m}${u.relative_humidity_2m}</p>
    <p>Viento: ${c.wind_speed_10m} ${u.wind_speed_10m}</p>`;
}

// 8. Mostrar el pronóstico de varios días
function mostrarPronostico(clima) {
  const d = clima.daily;

  // Los datos vienen en listas paralelas: la posición i de cada lista es el mismo día
  d.time.forEach((fecha, i) => {
    const estado = describirClima(d.weather_code[i]);
    const nombreDia = new Date(fecha + "T00:00:00")
      .toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });

    const tarjeta = document.createElement("div");
    tarjeta.className = "dia";
    tarjeta.innerHTML = `
      <p>${nombreDia}</p>
      <div class="icono">${estado.icono}</div>
      <p>Máx: ${d.temperature_2m_max[i]}°</p>
      <p>Mín: ${d.temperature_2m_min[i]}°</p>`;
    seccionPronostico.appendChild(tarjeta);
  });
}

// 9. Eventos
btnBuscar.addEventListener("click", buscarClima);
inputCiudad.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarClima();
});