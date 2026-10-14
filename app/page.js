
"use client";

import { useEffect, useState } from "react";

const DEPOSITOS = ["A", "B", "C"];

function criarCavalete(id) {
  return {
    id,
    x: 40 + ((id - 1) % 4) * 130,
    y: 50 + Math.floor((id - 1) / 4) * 110,
    orientacao: "horizontal",
  };
}

export default function Home() {
  const [deposito, setDeposito] = useState("A");
  const [plantas, setPlantas] = useState({ A: [], B: [], C: [] });
  const [selecionado, setSelecionado] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    try {
      const dados = localStorage.getItem("marmopedras-planta");
      if (dados) {
        const salvos = JSON.parse(dados);
        setPlantas({
          A: salvos.A || [],
          B: salvos.B || [],
          C: salvos.C || [],
        });
      }
    } catch {
      setMensagem("Não foi possível carregar a organização salva.");
    }
    setCarregado(true);
  }, []);

  const cavaletes = plantas[deposito];

  function atualizarCavaletes(novos) {
    setPlantas((anterior) => ({
      ...anterior,
      [deposito]: novos,
    }));
    setMensagem("");
  }

  function adicionar() {
    const proximoId =
      Math.max(0, ...cavaletes.map((c) => c.id)) + 1;

    atualizarCavaletes([...cavaletes, criarCavalete(proximoId)]);
    setSelecionado(proximoId);
  }

  function girar() {
    if (selecionado === null) return;

    atualizarCavaletes(
      cavaletes.map((c) =>
        c.id === selecionado
          ? {
              ...c,
              orientacao:
                c.orientacao === "horizontal"
                  ? "vertical"
                  : "horizontal",
            }
          : c
      )
    );
  }

  function excluir() {
    if (selecionado === null) return;

    atualizarCavaletes(
      cavaletes.filter((c) => c.id !== selecionado)
    );
    setSelecionado(null);
  }

  function mover(id, x, y) {
    atualizarCavaletes(
      cavaletes.map((c) =>
        c.id === id ? { ...c, x, y } : c
      )
    );
  }

  function salvar() {
    localStorage.setItem(
      "marmopedras-planta",
      JSON.stringify(plantas)
    );
    setMensagem("Organização salva neste navegador!");
  }

  if (!carregado) return <main>Carregando planta...</main>;

  return (
    <main className="pagina">
      <header className="cabecalho">
        <div>
          <span className="subtitulo">MARMOPEDRAS</span>
          <h1>Planejamento de Depósitos</h1>
          <p>Organize os cavaletes e planeje o espaço do estoque.</p>
        </div>
        <span className="etiqueta">Protótipo independente</span>
      </header>

      <section className="painel">
        <div className="barra">
          <div className="depositos">
            {DEPOSITOS.map((nome) => (
              <button
                key={nome}
                className={deposito === nome ? "ativo" : ""}
                onClick={() => {
                  setDeposito(nome);
                  setSelecionado(null);
                  setMensagem("");
                }}
              >
                Depósito {nome}
              </button>
            ))}
          </div>

          <div className="acoes">
            <button onClick={adicionar}>+ Adicionar cavalete</button>
            <button onClick={girar} disabled={selecionado === null}>
              Girar 90°
            </button>
            <button
              onClick={excluir}
              disabled={selecionado === null}
              className="excluir"
            >
              Excluir
            </button>
            <button onClick={salvar} className="salvar">
              Salvar organização
            </button>
          </div>
        </div>

        <div className="planta-wrapper">
          <div className="planta">
            <span className="nome-deposito">DEPÓSITO {deposito}</span>

            {cavaletes.map((c) => (
              <div
                key={c.id}
                className={`cavalete ${
                  selecionado === c.id ? "selecionado" : ""
                } ${c.orientacao}`}
                style={{ left: c.x, top: c.y }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setSelecionado(c.id);

                  const elemento = e.currentTarget;
                  const area = elemento.parentElement;
                  const areaRect = area.getBoundingClientRect();
                  const itemRect = elemento.getBoundingClientRect();

                  const offsetX = e.clientX - itemRect.left;
                  const offsetY = e.clientY - itemRect.top;

                  elemento.setPointerCapture(e.pointerId);

                  const moverPonteiro = (evento) => {
                    const largura = elemento.offsetWidth;
                    const altura = elemento.offsetHeight;

                    const x = Math.max(
                      0,
                      Math.min(
                        evento.clientX - areaRect.left - offsetX,
                        area.clientWidth - largura
                      )
                    );

                    const y = Math.max(
                      0,
                      Math.min(
                        evento.clientY - areaRect.top - offsetY,
                        area.clientHeight - altura
                      )
                    );

                    elemento.style.left = `${x}px`;
                    elemento.style.top = `${y}px`;
                  };

                  const finalizar = () => {
                    mover(
                      c.id,
                      parseFloat(elemento.style.left),
                      parseFloat(elemento.style.top)
                    );

                    elemento.removeEventListener(
                      "pointermove",
                      moverPonteiro
                    );
                    elemento.removeEventListener(
                      "pointerup",
                      finalizar
                    );
                    elemento.removeEventListener(
                      "pointercancel",
                      finalizar
                    );
                  };

                  elemento.addEventListener("pointermove", moverPonteiro);
                  elemento.addEventListener("pointerup", finalizar);
                  elemento.addEventListener("pointercancel", finalizar);
                }}
              >
                CV-{String(c.id).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        <footer className="rodape">
          <span>{cavaletes.length} cavalete(s) no Depósito {deposito}</span>
          <span>Selecione e arraste os cavaletes para reorganizar.</span>
        </footer>

        {mensagem && <p className="mensagem">{mensagem}</p>}
      </section>
    </main>
  );
}
