/** @format */

import {
  request,
  app,
  prepararBase,
  congelarReloj,
  cerrar,
  snap,
  snapDb,
} from "./helpers.js";
import { Turno, SolicitudCobro, Cobro } from "../../models/index.model.js";

/**
 * TEST DE CONTRATO - /api/cobros
 * Snapshots generados ANTES del refactor (Fase 0).
 */

const crearTurnoAtendido = (n) =>
  Turno.create({
    id_paciente: 1,
    id_estado: 2,
    fecha_hora_inicio: new Date(`2030-01-0${n}T10:00:00-03:00`),
    fecha_hora_fin: new Date(`2030-01-0${n}T10:30:00-03:00`),
    precio_final: 1000 * n,
    notas_consulta: `Turno ${n}`,
  });

describe("Contrato API /api/cobros", () => {
  beforeAll(async () => {
    congelarReloj();
    await prepararBase();
    for (const n of [1, 2, 3, 4, 5]) await crearTurnoAtendido(n);
  });
  afterAll(cerrar);

  test("GET / vacío y GET /:id inexistente", async () => {
    snap("lista-vacia", await request(app).get("/api/cobros"));
    snap("get-inexistente", await request(app).get("/api/cobros/9999"));
    snap("por-turno-inexistente", await request(app).get("/api/cobros/9999/cobros"));
  });

  test("POST /inmediato (201), duplicado (409) y validarExistencia (400/404)", async () => {
    snap(
      "inmediato-turno1",
      await request(app)
        .post("/api/cobros/inmediato")
        .send({ id_turno: 1, id_paciente: 1, monto_total: 1000, metodo_pago: "Transferencia" }),
    );
    snap(
      "inmediato-duplicado",
      await request(app)
        .post("/api/cobros/inmediato")
        .send({ id_turno: 1, id_paciente: 1, monto_total: 1000 }),
    );
    snap(
      "inmediato-turno-inexistente",
      await request(app)
        .post("/api/cobros/inmediato")
        .send({ id_turno: 999, id_paciente: 1, monto_total: 10 }),
    );
    snap(
      "inmediato-sin-turno",
      await request(app).post("/api/cobros/inmediato").send({ id_paciente: 1 }),
    );
  });

  test("POST /informal con entrega inicial parcial / total / sin entrega", async () => {
    snap(
      "informal-parcial",
      await request(app)
        .post("/api/cobros/informal")
        .send({
          id_turno: 2,
          id_paciente: 1,
          monto_total: 2000,
          entrega_inicial: 500,
          metodo_pago: "Tarjeta de débito",
          observaciones: "Plan en cuotas",
        }),
    );
    snap(
      "informal-entrega-total",
      await request(app)
        .post("/api/cobros/informal")
        .send({ id_turno: 3, id_paciente: 1, monto_a_cobrar: 3000, entrega_inicial: 9999, metodo_pago_id: 4 }),
    );
    snap(
      "informal-sin-entrega",
      await request(app)
        .post("/api/cobros/informal")
        .send({ id_turno: 4, id_paciente: 1, monto_total: 4000 }),
    );
    snap(
      "informal-duplicado",
      await request(app)
        .post("/api/cobros/informal")
        .send({ id_turno: 4, id_paciente: 1, monto_total: 4000 }),
    );
  });

  test("POST / crear solicitud (201), duplicada (409), validación Zod (400)", async () => {
    snap(
      "crear-solicitud-turno5",
      await request(app)
        .post("/api/cobros")
        .send({ id_turno: 5, id_paciente: 2, monto_a_cobrar: 5000, observaciones: "Solicitud manual" }),
    );
    snap(
      "crear-solicitud-duplicada",
      await request(app)
        .post("/api/cobros")
        .send({ turno_id: 5, paciente_id: 2, monto_total: 5000 }),
    );
    snap(
      "crear-solicitud-zod",
      await request(app).post("/api/cobros").send({ monto: -3 }),
    );
  });

  test("POST /registrar-pago: errores y flujos", async () => {
    snap(
      "pago-monto-invalido",
      await request(app).post("/api/cobros/registrar-pago").send({ turno_id: 4, monto: 0 }),
    );
    snap(
      "pago-sin-referencia",
      await request(app).post("/api/cobros/registrar-pago").send({ monto: 100 }),
    );
    snap(
      "pago-turno-inexistente",
      await request(app).post("/api/cobros/registrar-pago").send({ turno_id: 999, monto: 100 }),
    );
    snap(
      "pago-parcial-solicitud-existente",
      await request(app)
        .post("/api/cobros/registrar-pago")
        .send({ solicitud_cobro_id: 4, monto: 1000, metodo_pago: "efectivo" }),
    );
    snap(
      "pago-saldar-por-turno",
      await request(app)
        .post("/api/cobros/registrar-pago")
        .send({ turno_id: 4, monto: 99999, metodo_pago: "transfer" }),
    );
    snap(
      "pago-sobre-saldado",
      await request(app)
        .post("/api/cobros/registrar-pago")
        .send({ id_solicitud_cobro: 4, monto_a_cobrar: 50 }),
    );
  });

  test("POST /registrar-pago crea la solicitud si el turno no tenía", async () => {
    await Turno.create({
      id_paciente: 2,
      id_estado: 2,
      fecha_hora_inicio: new Date("2030-01-06T10:00:00-03:00"),
      fecha_hora_fin: new Date("2030-01-06T10:30:00-03:00"),
      precio_final: 800,
      notas_consulta: "Turno sin solicitud",
    });
    snap(
      "pago-crea-solicitud-parcial",
      await request(app)
        .post("/api/cobros/registrar-pago")
        .send({ turno_id: 6, monto: 300, observaciones: "Seña" }),
    );
  });

  test("GET por turno, por id, listados y filtros", async () => {
    snap("por-turno-2", await request(app).get("/api/cobros/2/cobros"));
    snap("por-turno-4", await request(app).get("/api/cobros/4/cobros"));
    snap("get-por-id", await request(app).get("/api/cobros/1"));
    snap("lista-default", await request(app).get("/api/cobros"));
    snap("lista-anio-actual-sin-datos", await request(app).get("/api/cobros?anio=2029"));
    snap("lista-historico", await request(app).get("/api/cobros?periodo=historico&limit=3&page=2"));
    snap("lista-search", await request(app).get("/api/cobros?anio=2030&search=Gomez"));
    snap("lista-orden-monto", await request(app).get("/api/cobros?anio=2030&sortField=monto&sortOrder=ASC"));
  });

  test("PUT /:id actualizar y recalcular estado; 404; Zod", async () => {
    snap(
      "update-monto-metodo",
      await request(app).put("/api/cobros/2").send({ monto: 700, metodo_pago: "Otro", observaciones: "Corregido" }),
    );
    snap("update-404", await request(app).put("/api/cobros/9999").send({ monto: 10 }));
    snap("update-zod", await request(app).put("/api/cobros/2").send({ monto: -1 }));
    snap("estado-solicitud-tras-update", await request(app).get("/api/cobros/2/cobros"));
  });

  test("PATCH /:id/delete elimina el cobro y recalcula la solicitud; 404", async () => {
    snap("delete-cobro", await request(app).patch("/api/cobros/1/delete"));
    snap("delete-cobro-404", await request(app).patch("/api/cobros/9999/delete"));
    snap("solicitud-tras-delete", await request(app).get("/api/cobros/1/cobros"));
  });

  test("Estado final de la BD", async () => {
    await snapDb("db-solicitudes", SolicitudCobro, { order: [["id", "ASC"]] });
    await snapDb("db-cobros", Cobro, { order: [["id", "ASC"]] });
  });
});

