/** @format */

import {
  request,
  app,
  prepararBase,
  congelarReloj,
  cerrar,
  snap,
} from "./helpers.js";
import { Turno, CategoriaGasto, Gasto } from "../../models/index.model.js";

/**
 * TEST DE CONTRATO - /api/caja y /api/gastos, /api/categorias-gastos
 * Snapshots generados ANTES del refactor (Fase 0).
 */

describe("Contrato API /api/caja, /api/gastos y /api/categorias-gastos", () => {
  beforeAll(async () => {
    congelarReloj();
    await prepararBase();

    // Turnos atendidos: 1 con solicitud saldada, 1 con deuda parcial, 1 sin solicitud
    for (const n of [1, 2, 3]) {
      await Turno.create({
        id_paciente: n === 3 ? 2 : 1,
        id_estado: 2,
        fecha_hora_inicio: new Date(`2030-01-0${n}T10:00:00-03:00`),
        fecha_hora_fin: new Date(`2030-01-0${n}T10:30:00-03:00`),
        precio_final: 1000 * n,
        notas_consulta: `Turno ${n}`,
      });
    }
    await request(app)
      .post("/api/cobros/inmediato")
      .send({ id_turno: 1, id_paciente: 1, monto_total: 1000, metodo_pago: "Efectivo" });
    await request(app)
      .post("/api/cobros/informal")
      .send({ id_turno: 2, id_paciente: 1, monto_total: 2000, entrega_inicial: 500, metodo_pago: "Tarjeta" });

    await CategoriaGasto.create({ nombre: "Insumos", descripcion: "Materiales" });
    await CategoriaGasto.create({ nombre: "Alquiler" });
  });
  afterAll(cerrar);

  test("GET /api/caja período por defecto (mes actual)", async () => {
    snap("caja-default", await request(app).get("/api/caja"));
  });

  test("GET /api/gastos + categorías (ABM)", async () => {
    snap("categorias-lista", await request(app).get("/api/categorias-gastos"));
    snap(
      "gasto-crear",
      await request(app)
        .post("/api/gastos")
        .send({ id_categoria_gasto: 1, monto: 300, concepto: "Guantes", metodo_pago: "Efectivo" }),
    );
    snap(
      "gasto-crear-con-fecha",
      await request(app)
        .post("/api/gastos")
        .send({ id_categoria_gasto: 2, monto: 1200, concepto: "Alquiler enero", fecha_gasto: "2030-01-03T12:00:00-03:00", metodo_pago: "Transferencia" }),
    );
    snap(
      "gasto-fuera-de-periodo",
      await request(app)
        .post("/api/gastos")
        .send({ id_categoria_gasto: 1, monto: 50, concepto: "Gasto 2029", fecha_gasto: "2029-06-10T12:00:00-03:00" }),
    );
    snap("gasto-zod", await request(app).post("/api/gastos").send({ monto: -1 }));
    snap("gastos-lista", await request(app).get("/api/gastos"));
    snap("gastos-lista-search", await request(app).get("/api/gastos?search=Alquiler"));
    snap("gastos-lista-categoria", await request(app).get("/api/gastos?categoria=1"));
    snap("gasto-por-id", await request(app).get("/api/gastos/1"));
    snap("gasto-404", await request(app).get("/api/gastos/9999"));
    snap("gasto-update", await request(app).put("/api/gastos/1").send({ monto: 350 }));
    snap("gasto-delete-toggle", await request(app).patch("/api/gastos/3/delete"));
  });

  test("GET /api/caja con gastos, períodos, búsqueda y paginación", async () => {
    snap("caja-mes-actual", await request(app).get("/api/caja"));
    snap("caja-mes-1", await request(app).get("/api/caja?mes=1&anio=2030"));
    snap("caja-anio", await request(app).get("/api/caja?periodo=anio&anio=2030"));
    snap("caja-todos", await request(app).get("/api/caja?mes=todos&anio=2029"));
    snap("caja-otro-mes-vacio", await request(app).get("/api/caja?mes=5&anio=2030"));
    snap(
      "caja-rango-explicito",
      await request(app).get("/api/caja?fecha_desde=2030-01-01&fecha_hasta=2030-01-31"),
    );
    snap(
      "caja-search-cobro",
      await request(app).get("/api/caja?searchCobro=Gomez&pageCobro=1&limitCobro=1"),
    );
    snap(
      "caja-search-gasto-paginado",
      await request(app).get("/api/caja?searchGasto=o&pageGasto=2&limitGasto=1"),
    );
  });

  test("Estado final de gastos", async () => {
    const rows = await Gasto.findAll({ raw: true, order: [["id_gasto", "ASC"]] }).catch(() => []);
    expect(rows).toMatchSnapshot("db-gastos");
  });
});

