const API_BASE =
  window.MINUTASK_API ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8001/api/v1"
    : `${window.location.origin}/api/v1`);

const form = document.getElementById("form-tarefa");
const mensagem = document.getElementById("mensagem");
const btnGeo = document.getElementById("btn-geo");

btnGeo.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada neste navegador.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById("lat").value = pos.coords.latitude;
      document.getElementById("lon").value = pos.coords.longitude;
    },
    () => alert("Não foi possível obter localização.")
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  dados.valor_sugerido = Number(dados.valor_sugerido || 0);
  dados.lat = Number(dados.lat);
  dados.lon = Number(dados.lon);

  mensagem.hidden = false;
  mensagem.classList.remove("erro");
  mensagem.textContent = "Publicando...";

  try {
    const res = await fetch(`${API_BASE}/publico/tarefas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || "Erro ao publicar");
    mensagem.textContent = `Tarefa #${json.id} publicada. Trabalhadores foram notificados.`;
    form.reset();
  } catch (err) {
    mensagem.classList.add("erro");
    mensagem.textContent = err.message;
  }
});
