"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const DEPOSITOS = ["A", "B", "C"];

const TAMANHO_MIN = { largura: 650, altura: 490 };

const TAMANHOS = [
  { largura: 650, altura: 490, nome: "650 x 490 (padrão)" },
  { largura: 800, altura: 600, nome: "800 x 600" },
  { largura: 1000, altura: 700, nome: "1000 x 700" },
  { largura: 1200, altura: 800, nome: "1200 x 800" },
  { largura: 1500, altura: 1000, nome: "1500 x 1000" },
  { largura: 2000, altura: 1200, nome: "2000 x 1200" },
];

function criarCavalete(id) {
  return {
    id,
    x: 40 + ((id - 1) % 4) * 130,
    y: 50 + Math.floor((id - 1) / 4) * 110,
    orientacao: "horizontal",
    anotacoes: "",
  };
}

export default function Home() {
  const [deposito, setDeposito] = useState("A");
  const [plantas, setPlantas] = useState({ A: [], B: [], C: [] });
  const [tamanhos, setTamanhos] = useState({
    A: TAMANHO_MIN,
    B: TAMANHO_MIN,
    C: TAMANHO_MIN,
  });
  const [selecionado, setSelecionado] = useState(null);
  const [carregado, setCarregado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === "Escape") setMenuAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  useEffect(() => {
    try {
      const dados = localStorage.getItem("marmopedras-planta");
      if (dados) {
        const salvos = JSON.parse(dados);
        const p = salvos.plantas || salvos;
        const t = salvos.tamanhos || {};

        setPlantas({
          A: p.A || [],
          B: p.B || [],
          C: p.C || [],
        });
        setTamanhos({
          A: t.A || TAMANHO_MIN,
          B: t.B || TAMANHO_MIN,
          C: t.C || TAMANHO_MIN,
        });
      }
    } catch {
      setMensagem("Não foi possível carregar a organização salva.");
    }
    setCarregado(true);
  }, []);

  const cavaletes = plantas[deposito];
  const tamanho = tamanhos[deposito];
  const cavaleteSelecionado = cavaletes.find((c) => c.id === selecionado);

  function atualizarCavaletes(novos) {
    setPlantas((anterior) => ({
      ...anterior,
      [deposito]: novos,
    }));
    setMensagem("");
  }

  function alterarTamanho(valor) {
    const [largura, altura] = valor.split("x").map(Number);

    setTamanhos((anterior) => ({
      ...anterior,
      [deposito]: { largura, altura },
    }));

    atualizarCavaletes(
      cavaletes.map((c) => {
        const w = c.orientacao === "horizontal" ? 100 : 36;
        const h = c.orientacao === "horizontal" ? 36 : 100;
        return {
          ...c,
          x: Math.max(0, Math.min(c.x, largura - w)),
          y: Math.max(0, Math.min(c.y, altura - h)),
        };
      })
    );
  }

  function adicionar() {
    const proximoId = Math.max(0, ...cavaletes.map((c) => c.id)) + 1;
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
                c.orientacao === "horizontal" ? "vertical" : "horizontal",
            }
          : c
      )
    );
  }

  function excluir() {
    if (selecionado === null) return;
    atualizarCavaletes(cavaletes.filter((c) => c.id !== selecionado));
    setSelecionado(null);
  }

  function mover(id, x, y) {
    atualizarCavaletes(
      cavaletes.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  }

  function atualizarAnotacoes(texto) {
    if (selecionado === null) return;
    atualizarCavaletes(
      cavaletes.map((c) =>
        c.id === selecionado ? { ...c, anotacoes: texto } : c
      )
    );
  }

  function salvar() {
    localStorage.setItem(
      "marmopedras-planta",
      JSON.stringify({ plantas, tamanhos })
    );
    setMensagem("Organização salva neste navegador!");
  }

  if (!carregado) return <main>Carregando planta...</main>;

  const valorTamanho = `${tamanho.largura}x${tamanho.altura}`;
  const ehTamanhoMinimo =
    tamanho.largura === TAMANHO_MIN.largura &&
    tamanho.altura === TAMANHO_MIN.altura;

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

        {/* ================= SELETOR DE TAMANHO INTEGRADO ================= */}
        <div className="seletor-tamanho-container">
          <div className="seletor-tamanho-info">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span>
              Tamanho do Depósito {deposito}:{" "}
              <strong>
                {tamanho.largura} × {tamanho.altura}
              </strong>
            </span>
          </div>

          <div className="seletor-tamanho-opcoes">
            {TAMANHOS.map((t) => {
              const valor = `${t.largura}x${t.altura}`;
              return (
                <button
                  key={valor}
                  className={`chip ${valor === valorTamanho ? "ativo" : ""}`}
                  onClick={() => alterarTamanho(valor)}
                  title={t.nome}
                >
                  {t.largura}×{t.altura}
                </button>
              );
            })}
          </div>
        </div>

        <div className="planta-wrapper">
          <div
            className="planta"
            style={{
              width: ehTamanhoMinimo ? "100%" : tamanho.largura,
              height: tamanho.altura,
            }}
          >
            <span className="nome-deposito">DEPÓSITO {deposito}</span>

            {cavaletes.map((c) => (
              <div
                key={c.id}
                className={`cavalete ${
                  selecionado === c.id ? "selecionado" : ""
                } ${c.orientacao} ${c.anotacoes ? "com-nota" : ""}`}
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

                  const inicioX = e.clientX;
                  const inicioY = e.clientY;
                  let moveu = false;

                  const moverPonteiro = (evento) => {
                    if (
                      Math.abs(evento.clientX - inicioX) > 4 ||
                      Math.abs(evento.clientY - inicioY) > 4
                    ) {
                      moveu = true;
                    }

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
                    if (moveu) {
                      mover(
                        c.id,
                        parseFloat(elemento.style.left),
                        parseFloat(elemento.style.top)
                      );
                    } else {
                      setMenuAberto(true);
                    }

                    elemento.removeEventListener("pointermove", moverPonteiro);
                    elemento.removeEventListener("pointerup", finalizar);
                    elemento.removeEventListener("pointercancel", finalizar);
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

        {cavaleteSelecionado &&
          menuAberto &&
          createPortal(
            <div
              className="menu-fundo"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setMenuAberto(false)}
            >
              <div
                className="menu-cavalete"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="menu-cavalete-topo">
                  <div>
                    <span className="menu-etiqueta">ANOTAÇÕES</span>
                    <h2>
                      CV-{String(cavaleteSelecionado.id).padStart(2, "0")}
                      <small> · Depósito {deposito}</small>
                    </h2>
                  </div>
                  <button
                    className="menu-fechar"
                    onClick={() => setMenuAberto(false)}
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>

                <div className="menu-corpo">
                  <textarea
                    autoFocus
                    value={cavaleteSelecionado.anotacoes || ""}
                    onChange={(e) => atualizarAnotacoes(e.target.value)}
                    placeholder="Digite aqui as anotações deste cavalete (ex.: tipo de pedra, lote, quantidade de chapas...)"
                    rows={6}
                  />

                  <div className="menu-cavalete-acoes">
                    <button onClick={() => setMenuAberto(false)}>
                      Fechar
                    </button>
                    <button
                      className="salvar"
                      onClick={() => {
                        salvar();
                        setMenuAberto(false);
                      }}
                    >
                      Salvar e fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        <footer className="rodape">
          <span>
            {cavaletes.length} cavalete(s) no Depósito {deposito}
          </span>
          <span>Selecione e arraste os cavaletes para reorganizar.</span>
        </footer>

        {mensagem && <p className="mensagem">{mensagem}</p>}
      </section>
    </main>
  );
}
